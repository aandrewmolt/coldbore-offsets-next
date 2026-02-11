interface WorkerTask {
  id: string;
  imageData: ArrayBuffer;
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  orientation: number | null;
}

interface WorkerResult {
  id: string;
  webpUrl: string;
  jpegUrl: string;
  size: number;
  error?: string;
}

type TaskCallback = (result: WorkerResult) => void;

const WORKER_CODE = `
self.onmessage = async function(e) {
  const { id, imageData, width, height, maxWidth, maxHeight, quality, orientation } = e.data;
  try {
    const blob = new Blob([imageData]);
    const bitmap = await createImageBitmap(blob);

    let w = bitmap.width;
    let h = bitmap.height;
    const needsRotation = orientation && [6, 8, 5, 7].includes(orientation);
    if (needsRotation) { [w, h] = [h, w]; }
    if (w > maxWidth || h > maxHeight) {
      const ratio = Math.min(maxWidth / w, maxHeight / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    if (orientation) {
      switch (orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, h, w); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
      }
    }

    if (needsRotation) {
      ctx.drawImage(bitmap, 0, 0, h, w);
    } else {
      ctx.drawImage(bitmap, 0, 0, w, h);
    }
    bitmap.close();

    const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality });
    const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });

    const [webpBuffer, jpegBuffer] = await Promise.all([
      webpBlob.arrayBuffer(),
      jpegBlob.arrayBuffer(),
    ]);

    // Convert to base64 data URLs
    const webpArr = new Uint8Array(webpBuffer);
    const jpegArr = new Uint8Array(jpegBuffer);
    let webpBin = '';
    let jpegBin = '';
    for (let i = 0; i < webpArr.length; i++) webpBin += String.fromCharCode(webpArr[i]);
    for (let i = 0; i < jpegArr.length; i++) jpegBin += String.fromCharCode(jpegArr[i]);

    const webpUrl = 'data:image/webp;base64,' + btoa(webpBin);
    const jpegUrl = 'data:image/jpeg;base64,' + btoa(jpegBin);

    self.postMessage({ id, webpUrl, jpegUrl, size: webpBlob.size });
  } catch (err) {
    self.postMessage({ id, webpUrl: '', jpegUrl: '', size: 0, error: err.message });
  }
};
`;

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ task: WorkerTask; callback: TaskCallback }> = [];
  private busy: Set<Worker> = new Set();
  private aborted = false;

  constructor(size?: number) {
    const poolSize = size ?? (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4);
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(url);
      this.workers.push(worker);
    }
    URL.revokeObjectURL(url);
  }

  process(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve) => {
      if (this.aborted) {
        resolve({ id: task.id, webpUrl: '', jpegUrl: '', size: 0, error: 'Aborted' });
        return;
      }

      const callback: TaskCallback = (result) => resolve(result);
      const freeWorker = this.workers.find((w) => !this.busy.has(w));

      if (freeWorker) {
        this.dispatch(freeWorker, task, callback);
      } else {
        this.queue.push({ task, callback });
      }
    });
  }

  private dispatch(worker: Worker, task: WorkerTask, callback: TaskCallback) {
    this.busy.add(worker);

    const handler = (e: MessageEvent<WorkerResult>) => {
      worker.removeEventListener('message', handler);
      this.busy.delete(worker);
      callback(e.data);

      // Process next in queue
      const next = this.queue.shift();
      if (next && !this.aborted) {
        this.dispatch(worker, next.task, next.callback);
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage(task);
  }

  abort() {
    this.aborted = true;
    this.queue = [];
  }

  terminate() {
    this.abort();
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
  }
}

let _supportsOffscreenCanvas: boolean | null = null;

export function supportsOffscreenCanvas(): boolean {
  if (_supportsOffscreenCanvas !== null) return _supportsOffscreenCanvas;
  try {
    if (typeof OffscreenCanvas === 'undefined') {
      _supportsOffscreenCanvas = false;
    } else {
      const oc = new OffscreenCanvas(1, 1);
      const ctx = oc.getContext('2d');
      _supportsOffscreenCanvas = !!ctx;
    }
  } catch {
    _supportsOffscreenCanvas = false;
  }
  return _supportsOffscreenCanvas;
}
