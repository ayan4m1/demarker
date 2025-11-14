import { SetStateAction } from 'react';

export type FormSchema = {
  images: Record<string, string>;
  threshold: number;
};

export type LoadingProgressItem = {
  file: string;
  loaded: number;
  total: number;
};

export interface LoadingProgressData {
  progressItems: string[];
  addItem: (item: LoadingProgressItem) => void;
  updateItem: (item: LoadingProgressItem) => void;
  removeItem: (item: LoadingProgressItem) => void;
}

export interface StateSetters {
  setStatus: (status: string | SetStateAction<string>) => void;
  setCompletedItems: (completedItems: number | SetStateAction<number>) => void;
  setLoadingMessage: (loadingMessage: string | SetStateAction<string>) => void;
  setResults: (
    results: Record<string, boolean> | SetStateAction<Record<string, boolean>>
  ) => void;
  setTime: (time: number | SetStateAction<number>) => void;
}
