// Photo metadata from EXIF extraction
export interface PhotoMetadata {
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  captureDate: Date | null;
  camera: string | null;
  location: GPSLocation | null;
  orientation: number | null;
  exposureTime: string | null;
  fNumber: string | null;
  iso: number | null;
  focalLength: string | null;
  flash: number | null;
  software: string | null;
}

export interface GPSLocation {
  lat: number;
  lng: number;
  string: string;
  altitude?: number | null;
}

export interface Photo {
  id: string;
  name: string;
  originalName: string;
  client: string;
  job: string;
  well: string;
  category: string;
  notes: string;
  dataUrl: string;
  jpegUrl: string;
  size: number;
  originalSize: number;
  type: string;
  lastModified: Date;
  uploadedAt: Date;
  captureDateTime: Date;
  metadata: PhotoMetadata;
  hasLongLag: boolean;
  manualLocation: GPSLocation | null;
  sortOrder: number;
}

export interface Well {
  name: string;
  count: number;
}

export interface ProjectInfo {
  clientName: string;
  jobName: string;
  jobDateTime: Date | null;
  projectNotes: string;
}

export interface CurrentFilter {
  well: string;
  category: string;
  search: string;
}

export interface CategoryDefinition {
  value: string;
  label: string;
  description: string;
}

export interface SavedProject {
  id: string;
  name: string;
  client: string;
  job: string;
  photoCount: number;
  wellCount: number;
  savedAt: string;
}

export interface ProjectData {
  version: string;
  client: string;
  job: string;
  datetime: string;
  notes: string;
  wells: Well[];
  wellLocations: Record<string, GPSLocation>;
  photos: Photo[];
  totalOriginalSize: number;
  totalOptimizedSize: number;
  savedAt: string;
}

export type SortField = 'name' | 'date' | 'size' | 'well' | 'category' | 'lag' | 'resolution' | 'custom';
