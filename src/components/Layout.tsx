import { Fragment } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Layout() {
  return (
    <Fragment>
      <Navbar bg="primary" expand="sm" variant="dark">
        <Container>
          <Navbar.Brand>Demarker</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav>
              <Nav.Link as={Link} to="/">
                <FontAwesomeIcon icon={faImages} /> Remove Watermarks
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4 h-100">
        <Outlet />
      </Container>
    </Fragment>
  );
}
