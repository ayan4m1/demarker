import { useCallback, useState } from 'react';

export default function useLoadingProgress() {
  const [progressItems, setProgressItems] = useState([]);
  const addItem = useCallback(
    (item) => setProgressItems((prev) => [...prev, item]),
    []
  );
  const updateItem = useCallback(
    (item) =>
      setProgressItems((prev) =>
        prev.map((existing) =>
          existing.file === item.file ? { ...existing, ...item } : item
        )
      ),
    []
  );
  const removeItem = useCallback(
    (item) =>
      setProgressItems((prev) =>
        prev.filter((existing) => existing.file !== item.file)
      ),
    []
  );

  return {
    progressItems,
    addItem,
    updateItem,
    removeItem
  };
}
