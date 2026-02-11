import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONFIG } from "./config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function generateId(): string {
  return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return entities[char] || char;
  });
}

export function detectCategory(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('casing')) {
    if (lower.includes('reference') || lower.includes('manual') || lower.includes('baseline')) return 'casing_reference';
    if (lower.includes('pressure') || lower.includes('digital') || lower.includes('psi')) return 'casing_pressure';
    return 'casing_fullview';
  }
  if (lower.includes('tubing')) {
    if (lower.includes('reference') || lower.includes('manual') || lower.includes('baseline')) return 'tubing_reference';
    if (lower.includes('pressure') || lower.includes('digital') || lower.includes('psi')) return 'tubing_pressure';
    return 'tubing_fullview';
  }
  if (lower.includes('overview')) return 'overview';
  if (lower.includes('sign')) return 'signage';
  if (lower.includes('equipment')) return 'equipment';
  return '';
}

export function debounce<T extends (...args: unknown[]) => void>(func: T, wait?: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait ?? CONFIG.DEBOUNCE_DELAY);
  }) as unknown as T;
}

export function isValidImageFile(file: File): boolean {
  if (file.type && (CONFIG.VALID_IMAGE_TYPES as readonly string[]).includes(file.type.toLowerCase())) return true;
  const fileName = file.name.toLowerCase();
  return CONFIG.VALID_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

export function validateCoordinates(lat: string | number, lng: string | number): boolean {
  const latitude = parseFloat(String(lat));
  const longitude = parseFloat(String(lng));
  return !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function downloadFile(content: BlobPart, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseMapUrl(input: string): { lat: number; lng: number } | { error: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Short Google Maps links - can't resolve client-side
  if (/goo\.gl\/maps|maps\.app\.goo\.gl/i.test(trimmed)) {
    return { error: 'Open link in browser first, copy full URL' };
  }

  // Raw coordinates: "40.123, -105.456" or "40.123 -105.456"
  const rawMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (validateCoordinates(lat, lng)) return { lat, lng };
    return { error: 'Coordinates out of range' };
  }

  // Google Maps: /@lat,lng or @lat,lng
  const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (validateCoordinates(lat, lng)) return { lat, lng };
    return { error: 'Coordinates out of range' };
  }

  // Google Maps: ?q=lat,lng or &q=lat,lng
  const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (validateCoordinates(lat, lng)) return { lat, lng };
    return { error: 'Coordinates out of range' };
  }

  // Waze: ll=lat,lng or to=ll.lat,lng
  const wazeMatch = trimmed.match(/(?:ll=|to=ll\.)(-?\d+\.?\d*)[,%](-?\d+\.?\d*)/);
  if (wazeMatch) {
    const lat = parseFloat(wazeMatch[1]);
    const lng = parseFloat(wazeMatch[2]);
    if (validateCoordinates(lat, lng)) return { lat, lng };
    return { error: 'Coordinates out of range' };
  }

  // Apple Maps: ll=lat,lng
  const appleMatch = trimmed.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (appleMatch) {
    const lat = parseFloat(appleMatch[1]);
    const lng = parseFloat(appleMatch[2]);
    if (validateCoordinates(lat, lng)) return { lat, lng };
    return { error: 'Coordinates out of range' };
  }

  // Google Maps place URL: /place/.../@lat,lng already covered by atMatch
  // Try to extract any lat,lng pair from a URL as last resort
  const anyMatch = trimmed.match(/(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/);
  if (anyMatch) {
    const lat = parseFloat(anyMatch[1]);
    const lng = parseFloat(anyMatch[2]);
    if (validateCoordinates(lat, lng)) return { lat, lng };
  }

  return { error: 'Could not parse coordinates from input' };
}

export function getLocalTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
