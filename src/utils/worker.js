import {
  full,
  RawImage,
  AutoModel,
  AutoProcessor
} from '@huggingface/transformers';

async function hasFp16() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter.features.has('shader-f16');
  } catch {
    return false;
  }
}

class WatermarkSingleton {
  static model;
  static processor;

  static async getInstance(progress_callback = null) {
    const model = 'ayan4m1/Watermark-Detection-YOLO11-ONNX';
    // const dtype = (await hasFp16()) ? 'fp16' : 'fp32';
    const dtype = 'fp32';

    this.processor = AutoProcessor.from_pretrained(model);
    this.model = AutoModel.from_pretrained(model, {
      dtype,
      device: 'webgpu',
      progress_callback
    });

    return Promise.all([this.model, this.processor]);
  }
}

async function load() {
  self.postMessage({
    status: 'loading',
    data: 'Loading model...'
  });

  // Load the pipeline and send progress messages to the main window
  await WatermarkSingleton.getInstance((x) => {
    self.postMessage(x);
  });

  self.postMessage({ status: 'ready' });
}

async function run({ images }) {
  const start = performance.now();
  const [model, processor] = await WatermarkSingleton.getInstance();

  for (const [key, value] of Object.entries(images)) {
    const image = await RawImage.fromURL(value);
    const { pixel_values } = await processor(image);
    const { output0 } = await model({ images: pixel_values });

    const permuted = output0[0].transpose(1, 0);
    const threshold = 0.5;
    let watermarked = false;
    for (const row of permuted.tolist()) {
      const score = row[4];

      if (score < threshold) {
        continue;
      }

      watermarked = true;
      break;
    }

    self.postMessage({
      status: 'detection',
      image: key,
      watermarked
    });
  }

  const end = performance.now();

  self.postMessage({
    status: 'complete',
    time: end - start
  });
}

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'load':
      load(data);
      break;

    case 'run':
      run(data);
      break;
  }
});
