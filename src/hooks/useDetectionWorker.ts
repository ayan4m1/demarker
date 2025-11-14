import { useCallback, useEffect, useRef } from 'react';

import { DetectionStatus } from '../utils';
import { StateSetters, LoadingProgressData } from '../types';

export default function useDetectionWorker(
  { addItem, updateItem, removeItem }: LoadingProgressData,
  {
    setStatus,
    setCompletedItems,
    setLoadingMessage,
    setResults,
    setTime
  }: StateSetters
) {
  const handleMessage = useCallback(
    (e: MessageEvent) => {
      switch (e.data.status) {
        case 'loading':
          setStatus(DetectionStatus.Loading);
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
          setStatus(DetectionStatus.Ready);
          break;
        case 'detection':
          setCompletedItems((prev) => prev + 1);
          setResults((prev) => ({
            ...prev,
            [e.data.image]: e.data.watermarked
          }));
          break;
        case 'complete':
          setStatus(DetectionStatus.Results);
          setTime(e.data.time);
          break;
      }
    },
    [
      addItem,
      updateItem,
      removeItem,
      setCompletedItems,
      setTime,
      setStatus,
      setResults,
      setLoadingMessage
    ]
  );

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
