import { PhotoMetadata } from '@/lib/types';

function convertDMSToDD(dms: number[], ref: string): number {
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd = dd * -1;
  return dd;
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

export async function extractMetadata(file: File): Promise<PhotoMetadata> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const metadata: PhotoMetadata = {
    width: img.width,
    height: img.height,
    aspectRatio: (img.width / img.height).toFixed(2),
    megapixels: ((img.width * img.height) / 1000000).toFixed(1),
    captureDate: null,
    camera: null,
    location: null,
    orientation: null,
    exposureTime: null,
    fNumber: null,
    iso: null,
    focalLength: null,
    flash: null,
    software: null,
  };

  try {
    const EXIF = (await import('exif-js')).default;
    return new Promise((resolve) => {
      EXIF.getData(img as unknown as string, function (this: Record<string, unknown>) {
        try {
          const exifData = EXIF.getAllTags(this);
          if (exifData.DateTimeOriginal) {
            metadata.captureDate = new Date(
              (exifData.DateTimeOriginal as string).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
            );
          } else if (exifData.DateTime) {
            metadata.captureDate = new Date(
              (exifData.DateTime as string).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
            );
          }
          if (exifData.Make || exifData.Model) {
            metadata.camera = `${exifData.Make || ''} ${exifData.Model || ''}`.trim();
          }
          if (exifData.GPSLatitude && exifData.GPSLongitude) {
            const lat = convertDMSToDD(exifData.GPSLatitude as number[], exifData.GPSLatitudeRef as string);
            const lon = convertDMSToDD(exifData.GPSLongitude as number[], exifData.GPSLongitudeRef as string);
            metadata.location = {
              lat,
              lng: lon,
              string: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
              altitude: (exifData.GPSAltitude as number) || null,
            };
          }
          metadata.orientation = (exifData.Orientation as number) || 1;
          if (exifData.ExposureTime) {
            const et = exifData.ExposureTime as number;
            metadata.exposureTime = et < 1 ? `1/${Math.round(1 / et)}s` : `${et}s`;
          }
          if (exifData.FNumber) metadata.fNumber = `f/${exifData.FNumber}`;
          metadata.iso = (exifData.ISOSpeedRatings as number) || null;
          if (exifData.FocalLength) metadata.focalLength = `${exifData.FocalLength}mm`;
          metadata.flash = (exifData.Flash as number) || null;
          metadata.software = (exifData.Software as string) || null;
        } catch (e) {
          console.error('EXIF error:', e);
        }
        resolve(metadata);
      });
    });
  } catch {
    return metadata;
  }
}
