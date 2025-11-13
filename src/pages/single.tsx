import { useFormik } from 'formik';
import {
  ChangeEvent,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  ProgressBar,
  Row
} from 'react-bootstrap';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import useWorker from '../hooks/useWorker';
import { SingleFormSchema } from '../types/index';
import useLoadingProgress from '../hooks/useLoadingProgress';
import DataPrivacyAlert from '../components/DataPrivacyAlert';
import {
  bufferToImageString,
  getPageTitle,
  webGpuAvailable
} from '../utils/index';

export function Component() {
  const imageRef = useRef(null);

  const [time, setTime] = useState(0);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('loading');
  const { progressItems, addItem, updateItem, removeItem } =
    useLoadingProgress();
  const handleWorkerMessage = useCallback(
    (e: MessageEvent) => {
      switch (e.data.status) {
        case 'loading':
          console.log('loading model');
          setStatus('loading');
          setLoadingMessage(e.data.data);
          break;
        case 'initiate':
          addItem(e.data);
          break;
        case 'progress':
          updateItem(e.data);
          break;
        case 'done':
          removeItem(e.data);
          break;
        case 'ready':
          setStatus('ready');
          break;
        case 'detection':
          setResult(e.data.watermarked);
          break;
        case 'complete':
          setTime(e.data.time);
          setStatus('results');
          break;
      }
    },
    [addItem, updateItem, removeItem]
  );
  const worker = useWorker(handleWorkerMessage);
  const { values, handleSubmit, handleChange, setFieldValue } =
    useFormik<SingleFormSchema>({
      initialValues: {
        image: '',
        threshold: 50
      },
      onSubmit: ({ image, threshold }) => {
        setStatus('loading');
        setLoadingMessage('Running detection...');
        worker.current.postMessage({
          type: 'run',
          data: {
            images: { 'file.png': image },
            threshold: threshold / 100
          }
        });
      }
    });
  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.files.length) {
        return;
      }

      const file = e.currentTarget.files.item(0);
      const mimeType = file.type;
      const fileBytes = await file.bytes();

      setFieldValue('image', bufferToImageString(fileBytes, mimeType));
    },
    [setFieldValue]
  );

  useEffect(() => {
    if (!worker.current) {
      return;
    }

    worker.current.postMessage({
      type: 'load'
    });
  }, [worker]);

  return (
    <Fragment>
      <title>{getPageTitle('Single Image')}</title>
      <Container fluid>
        <Row>
          <Col xs={12}>
            <DataPrivacyAlert />
          </Col>
        </Row>
        <Row className="g-0">
          {webGpuAvailable ? (
            <Fragment>
              <Col sm={4} xs={12}>
                <Card body className="me-2">
                  <Card.Title>Inputs</Card.Title>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="my-2">
                      <Form.Label>Image</Form.Label>
                      <input
                        name="image"
                        onChange={handleFileChange}
                        ref={imageRef}
                        style={{ display: 'none' }}
                        type="file"
                      />
                      {values.image && (
                        <img
                          alt="Uploaded Image Preview"
                          src={values.image}
                          style={{
                            height: 200,
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto'
                          }}
                        />
                      )}
                      <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                          border: '4px dashed #ccc',
                          borderRadius: 12,
                          margin: 24,
                          padding: 20,
                          minHeight: 200,
                          flexGrow: 1
                        }}
                      >
                        Drop image or{' '}
                        <Button
                          className="ms-2"
                          onClick={() => {
                            imageRef.current?.click();
                          }}
                          variant="secondary"
                        >
                          browse
                        </Button>
                      </div>
                    </Form.Group>
                    <Form.Group className="my-2">
                      <Form.Label>Detection Threshold</Form.Label>
                      <InputGroup>
                        <Form.Control
                          max={100}
                          min={0}
                          name="threshold"
                          onChange={handleChange}
                          step={1}
                          type="number"
                          value={values.threshold}
                        />
                        <InputGroup.Text>%</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="text-end">
                      <Button type="submit" variant="success">
                        Submit
                      </Button>
                    </Form.Group>
                  </Form>
                </Card>
              </Col>
              <Col sm={8} xs={12}>
                <Card body>
                  <Card.Title>Results</Card.Title>
                  {['loading', 'running'].includes(status) && (
                    <div className="text-center">
                      <FontAwesomeIcon
                        className="mb-2"
                        icon={faSpinner}
                        size="3x"
                        spin
                      />
                      <p>{loadingMessage}</p>
                      {progressItems.map(({ file, loaded, total }) => (
                        <ProgressBar
                          key={file}
                          label={file}
                          max={total}
                          now={loaded}
                        />
                      ))}
                    </div>
                  )}
                  {status === 'results' && (
                    <Fragment>
                      <p>Execution time: {time.toFixed(2)}ms</p>
                      <p>Image is {result ? '' : 'not'} watermarked!</p>
                    </Fragment>
                  )}
                </Card>
              </Col>
            </Fragment>
          ) : (
            <Alert variant="danger">
              Your browser does not support WebGPU. This page will not work
              correctly.
            </Alert>
          )}
        </Row>
      </Container>
    </Fragment>
  );
}
