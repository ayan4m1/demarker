import { Alert } from 'react-bootstrap';

import { webGpuAvailable } from '../utils';
import { ReactNode } from 'react';

interface IProps {
  children: ReactNode;
}

export default function WebGPUWrapper({ children }: IProps) {
  return webGpuAvailable ? (
    children
  ) : (
    <Alert variant="danger">
      Your browser does not support WebGPU. This page will not work correctly.
    </Alert>
  );
}
