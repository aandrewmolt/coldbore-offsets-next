import { CONFIG } from '@/lib/config';

export interface OptimizedImage {
  dataUrl: string;
  jpegUrl: string;
  size: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function optimizeImage(file: File, orientation?: number | null): Promise<OptimizedImage> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  let width = img.width;
  let height = img.height;

  // Handle EXIF orientation
  const needsRotation = orientation && [6, 8, 5, 7].includes(orientation);
  if (needsRotation) {
    [width, height] = [height, width];
  }

  const maxWidth = CONFIG.MAX_IMAGE_WIDTH;
  const maxHeight = CONFIG.MAX_IMAGE_HEIGHT;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply orientation transforms
  if (orientation) {
    switch (orientation) {
      case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, height, width); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
    }
  }

  if (needsRotation) {
    ctx.drawImage(img, 0, 0, height, width);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }

  const webpUrl = canvas.toDataURL('image/webp', CONFIG.IMAGE_QUALITY);
  const jpegUrl = canvas.toDataURL('image/jpeg', CONFIG.IMAGE_QUALITY);
  const webpSize = Math.round((webpUrl.length - 'data:image/webp;base64,'.length) * 3 / 4);

  canvas.width = 0;
  canvas.height = 0;

  return { dataUrl: webpUrl, jpegUrl, size: webpSize };
}
