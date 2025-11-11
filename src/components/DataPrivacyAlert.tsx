import { Alert, Button } from 'react-bootstrap';
import useLocalStorageState from 'use-local-storage-state';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function DataPrivacyAlert() {
  const [show, setShow] = useLocalStorageState('dismissedDataPrivacyAlert', {
    defaultValue: true
  });

  return show ? (
    <Alert variant="info">
      <Alert.Heading>
        Your Privacy Matters
        <span className="float-end">
          <Button onClick={() => setShow(false)} variant="outline-secondary">
            <FontAwesomeIcon icon={faX} />
          </Button>
        </span>
      </Alert.Heading>
      <span>
        This website runs entirely on your device and does not send any data to
        any remote location.
      </span>
    </Alert>
  ) : null;
}
