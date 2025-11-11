import { useEffect, useRef } from 'react';

export default function useWorker(
  handleMessage: (this: Worker, ev: MessageEvent<Worker>) => void
) {
  const worker = useRef<Worker>(null);

  useEffect(() => {
    if (worker.current) {
      return;
    }

    const newWorker = new Worker(
      new URL('../utils/worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.current = newWorker;
    worker.current.addEventListener('message', handleMessage);

    return () => {
      newWorker.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return worker;
}
