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
  ProgressBar,
  Row
} from 'react-bootstrap';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { FormSchema } from '../types/index';
import { bufferToImageString, getPageTitle } from '../utils/index';

const webGpuAvailable = 'gpu' in navigator;

export function Component() {
  const worker = useRef(null);
  const imageRef = useRef(null);

  const [time, setTime] = useState(0);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progressItems, setProgressItems] = useState([]);
  const { handleSubmit, setFieldValue } = useFormik<FormSchema>({
    initialValues: {
      images: {}
    },
    onSubmit: ({ images }) => {
      setStatus('running');
      worker.current.postMessage({
        type: 'run',
        data: { images }
      });
    }
  });
  const handleWorkerMessage = useCallback((e: MessageEvent) => {
    switch (e.data.status) {
      // Set the loading message and initiate loading
      case 'loading':
        setStatus('loading');
        setLoadingMessage(e.data.data);
        break;

      // Add a new progress item to the list
      case 'initiate':
        setProgressItems((prev) => [...prev, e.data]);
        break;

      // Update one of the progress items.
      case 'progress':
        setProgressItems((prev) =>
          prev.map((item) => {
            if (item.file === e.data.file) {
              return { ...item, ...e.data };
            }
            return item;
          })
        );
        break;

      // Remove completed progress item from the list.
      case 'done':
        setProgressItems((prev) =>
          prev.filter((item) => item.file !== e.data.file)
        );
        break;

      // The worker is ready to perform inference.
      case 'ready':
        setStatus('ready');
        break;

      // Inference task is complete, display results
      case 'complete':
        setResult(e.data.result);
        setTime(e.data.time);
        setStatus('ready');
        break;
    }
  }, []);
  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.files.length) {
        return;
      }

      // worker.current.postMessage({ type: 'reset' });

      // todo: handle multiple
      const file = e.currentTarget.files.item(0);
      const mimeType = file.type;
      const fileBytes = await file.bytes();

      setFieldValue('image', bufferToImageString(fileBytes, mimeType));
    },
    [setFieldValue]
  );

  useEffect(() => {
    if (worker.current) {
      return;
    }

    const newWorker = new Worker(
      new URL('../utils/worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.current = newWorker;
    worker.current.addEventListener('message', handleWorkerMessage);

    return () => {
      newWorker.removeEventListener('message', handleWorkerMessage);
    };
  }, [handleWorkerMessage]);

  return (
    <Fragment>
      <title>{getPageTitle('Single Task')}</title>
      <Container fluid>
        <Row className="g-0">
          {webGpuAvailable ? (
            <Fragment>
              <Col sm={4} xs={12}>
                <Card body className="me-2">
                  <Card.Title>Images</Card.Title>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="text-center">
                      <input
                        name="images"
                        onChange={handleFileChange}
                        ref={imageRef}
                        style={{ display: 'none' }}
                        type="file"
                      />
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
                  {status === 'ready' && (
                    <Fragment>
                      <p>Execution time: {time.toFixed(2)}</p>
                      <p>Result present: {JSON.stringify(result)}</p>
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
