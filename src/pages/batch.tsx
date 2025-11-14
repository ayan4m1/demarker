import { extname } from 'path';
import { useFormik } from 'formik';
import { downloadZip } from 'client-zip';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  ListGroup,
  ProgressBar,
  Row
} from 'react-bootstrap';
import {
  faCheck,
  faDownload,
  faSpinner,
  faX
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { FormSchema } from '../types/index';
import WebGPUWrapper from '../components/WebGPUWrapper';
import useDetectionWorker from '../hooks/useDetectionWorker';
import useLoadingProgress from '../hooks/useLoadingProgress';
import DataPrivacyAlert from '../components/DataPrivacyAlert';
import {
  allowedImageTypes,
  bufferToImageString,
  DetectionStatus,
  getPageTitle,
  imageStringToBuffer
} from '../utils/index';

export function Component() {
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [completedItems, setCompletedItems] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadingProgress = useLoadingProgress();
  const { progressItems } = loadingProgress;
  const worker = useDetectionWorker(loadingProgress, {
    setCompletedItems,
    setLoadingMessage,
    setResults,
    setStatus,
    setTime
  });
  const { values, handleSubmit, handleChange, setFieldValue } =
    useFormik<FormSchema>({
      initialValues: {
        images: {},
        threshold: 50
      },
      onSubmit: ({ images, threshold }) => {
        setStatus(DetectionStatus.Running);
        setCompletedItems(0);
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

    for (let i = 0; i < imageRef.current.files.length; i++) {
      const file = imageRef.current.files.item(i);
      const filename = file.name;
      const mimeType = file.type;
      const fileBytes = await file.bytes();

      if (!allowedImageTypes.includes(extname(filename))) {
        continue;
      }

      await setFieldValue('images', (prev: Record<string, string>) => ({
        ...prev,
        [filename]: bufferToImageString(fileBytes, mimeType)
      }));
    }
  }, [setFieldValue]);
  const handleDownloadClick = useCallback(async () => {
    const blob = await downloadZip(
      Object.entries(values.images)
        .filter(([filename]) =>
          Object.entries(results).some(
            ([resultFile, watermarked]) =>
              filename === resultFile && !watermarked
          )
        )
        .map(([filename, data]) => ({
          name: filename,
          input: imageStringToBuffer(data)
        }))
    ).blob();
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'test.zip';
    link.click();
    link.remove();
  }, [values, results]);

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
      <title>{getPageTitle('Dewatermark Batch')}</title>
      <Container fluid>
        <Row>
          <Col xs={12}>
            <DataPrivacyAlert />
          </Col>
        </Row>
        <Row className="g-0">
          <WebGPUWrapper>
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
                      <Form.Label>Images</Form.Label>
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
                        Drop images or{' '}
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
                    {Boolean(Object.entries(values.images).length) && (
                      <Form.Group className="my-2">
                        <Form.Label>File List</Form.Label>
                        <div style={{ maxHeight: 200, overflowY: 'scroll' }}>
                          <ListGroup>
                            {Object.entries(values.images).map(([key]) => (
                              <ListGroup.Item key={key}>{key}</ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      </Form.Group>
                    )}
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
                  {[DetectionStatus.Loading, DetectionStatus.Running].includes(
                    status
                  ) && (
                    <div className="text-center">
                      <FontAwesomeIcon
                        className="mb-2"
                        icon={faSpinner}
                        size="3x"
                        spin
                      />
                      {status === DetectionStatus.Loading ? (
                        <Fragment>
                          <p>{loadingMessage}</p>
                          {progressItems.map(({ file, loaded, total }) => (
                            <ProgressBar
                              key={file}
                              label={file}
                              max={total}
                              min={0}
                              now={loaded}
                            />
                          ))}
                        </Fragment>
                      ) : (
                        <Fragment>
                          <p>Running detection...</p>
                          <ProgressBar
                            animated
                            label={`${Math.round(
                              (completedItems /
                                Object.entries(values.images).length) *
                                1e2
                            )}%`}
                            max={Object.entries(values.images).length}
                            min={0}
                            now={completedItems}
                            striped
                          />
                        </Fragment>
                      )}
                    </div>
                  )}
                  {status === 'results' && (
                    <Fragment>
                      <p>Execution time: {time.toFixed(2)}ms</p>
                      <ListGroup>
                        {Object.entries(values.images).map(([filename]) => (
                          <ListGroup.Item key={filename}>
                            <FontAwesomeIcon
                              color={results[filename] ? 'red' : 'green'}
                              icon={results[filename] ? faX : faCheck}
                            />{' '}
                            {filename} is {results[filename] ? '' : 'not'}{' '}
                            watermarked
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      <Button
                        className="my-2"
                        onClick={handleDownloadClick}
                        variant="primary"
                      >
                        <FontAwesomeIcon icon={faDownload} /> Download
                        unwatermarked images
                      </Button>
                    </Fragment>
                  )}
                </Card>
              </Col>
            </Fragment>
          </WebGPUWrapper>
        </Row>
      </Container>
    </Fragment>
  );
}
