import { Fragment } from 'react';
import { Container } from 'react-bootstrap';
import { isRouteErrorResponse, useRouteError } from 'react-router';

export default function ErrorBoundary() {
  const error = useRouteError();

  return (
    <Container>
      <h1>Error</h1>
      {isRouteErrorResponse(error) ? (
        <h1>
          {error.status} {error.statusText}
        </h1>
      ) : error instanceof Error ? (
        <Fragment>
          <h1>{error.message}</h1>
          <pre>{error.stack}</pre>
        </Fragment>
      ) : (
        <h1>{error as string}</h1>
      )}
    </Container>
  );
}
