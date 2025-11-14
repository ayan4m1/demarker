import { Fragment } from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Navbar } from 'react-bootstrap';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Layout() {
  return (
    <Fragment>
      <Navbar bg="primary" expand="sm" variant="dark">
        <Container>
          <Navbar.Brand>
            <FontAwesomeIcon icon={faImages} size="lg" /> Demarker
            <span className="ms-4">
              Filter out watermarked images using your local device and WebGPU
            </span>
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="mt-4 h-100">
        <Outlet />
      </Container>
    </Fragment>
  );
}
