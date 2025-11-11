export type SingleFormSchema = {
  image: string;
  threshold: number;
};

export type BatchFormSchema = {
  images: Record<string, string>;
  threshold: number;
};
