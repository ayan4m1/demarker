import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createHashRouter } from 'react-router-dom';

import './index.scss';
import Layout from './components/Layout';
import SuspenseFallback from './components/SuspenseFallback';
import ErrorBoundary from './components/ErrorBoundary';

const root = createRoot(document.getElementById('root'));
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        lazy: () => import(`./pages/single`)
      }
    ]
  }
]);

root.render(
  <Suspense fallback={<SuspenseFallback />}>
    <RouterProvider router={router} />
  </Suspense>
);
