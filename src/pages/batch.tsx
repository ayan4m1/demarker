import { useFormik } from 'formik';
import { Fragment, useCallback, useRef, useState } from 'react';
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

import useWorker from '../hooks/useWorker';
import { BatchFormSchema } from '../types/index';
import useLoadingProgress from '../hooks/useLoadingProgress';
import { bufferToImageString, getPageTitle } from '../utils/index';

const webGpuAvailable = 'gpu' in navigator;

export function Component() {
  const imageRef = useRef<HTMLInputElement>(null);

  const [time, setTime] = useState(0);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loadingMessage, setLoadingMessage] = useState('');
  const { progressItems, addItem, updateItem, removeItem } =
    useLoadingProgress();
  const handleWorkerMessage = useCallback(
    (e: MessageEvent) => {
      switch (e.data.status) {
        // Set the loading message and initiate loading
        case 'loading':
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
          setResults((prev) => ({
            ...prev,
            [e.data.image]: e.data.watermarked
          }));
          break;
        case 'complete':
          setTime(e.data.time);
          setStatus('ready');
          break;
      }
    },
    [addItem, updateItem, removeItem]
  );
  const worker = useWorker(handleWorkerMessage);
  const { values, handleSubmit, handleChange, setFieldValue } =
    useFormik<BatchFormSchema>({
      initialValues: {
        images: {},
        threshold: 50
      },
      onSubmit: ({ images, threshold }) => {
        setStatus('running');
        worker.current.postMessage({
          type: 'run',
          data: {
            images,
            threshold: threshold / 100
          }
        });
      }
    });
  const handleFileChange = useCallback(async () => {
    if (!imageRef.current.files.length) {
      return;
    }

    // worker.current.postMessage({ type: 'reset' });

    for (let i = 0; i < imageRef.current.files.length; i++) {
      const file = imageRef.current.files.item(i);
      const filename = file.name;
      const mimeType = file.type;
      const fileBytes = await file.bytes();

      await setFieldValue('images', (prev: Record<string, string>) => ({
        ...prev,
        [filename]: bufferToImageString(fileBytes, mimeType)
      }));
    }
  }, [setFieldValue]);

  return (
    <Fragment>
      <title>{getPageTitle('Image Batch')}</title>
      <Container fluid>
        <Row className="g-0">
          {webGpuAvailable ? (
            <Fragment>
              <Col sm={4} xs={12}>
                <Card body className="me-2">
                  <Card.Title>Inputs</Card.Title>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="my-2">
                      <input
                        multiple
                        name="images"
                        onChange={handleFileChange}
                        ref={imageRef}
                        style={{ display: 'none' }}
                        type="file"
                      />
                      <Form.Label>Image(s)</Form.Label>
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
                        Drop image(s) or{' '}
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
                      <Form.Control
                        max={100}
                        min={0}
                        name="threshold"
                        onChange={handleChange}
                        step={1}
                        type="number"
                        value={values.threshold}
                      />
                    </Form.Group>
                    <Form.Group className="my-2">
                      <Form.Label>Images</Form.Label>
                      <div style={{ maxHeight: 200, overflowY: 'scroll' }}>
                        {Object.entries(values.images).map(([key]) => (
                          <p key={key}>{key}</p>
                        ))}
                      </div>
                    </Form.Group>
                    <Form.Group className="text-end">
                      <Button
                        disabled={!Object.entries(values.images).length}
                        type="submit"
                        variant="success"
                      >
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
                  {status === 'ready' && (
                    <Fragment>
                      <p>Execution time: {time.toFixed(2)}</p>
                      <p>Results: {JSON.stringify(results)}</p>
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
