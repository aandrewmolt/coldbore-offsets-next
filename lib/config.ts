import { CategoryDefinition } from './types';

export const CONFIG = {
  MAX_IMAGE_WIDTH: 1920,
  MAX_IMAGE_HEIGHT: 1920,
  IMAGE_QUALITY: 0.85,
  LAG_THRESHOLD_HOURS: 24,
  MAX_FILENAME_LENGTH: 50,
  BATCH_SIZE: 5,
  STORAGE_KEY_PREFIX: 'shearfrac_',
  AUTO_SAVE_INTERVAL: 60000,
  DEBOUNCE_DELAY: 300,
  STATUS_DISPLAY_TIME: 3000,
  PDF_MAX_IMAGES_PER_PAGE: 4,
  ZIP_COMPRESSION_LEVEL: 0.6,
  PHOTO_CATEGORIES: [
    { value: '', label: 'Unassigned', description: 'Photo has not been categorized yet' },
    { value: 'casing_fullview', label: 'Casing - Full View', description: "Shows complete casing setup and how it's rigged up" },
    { value: 'casing_pressure', label: 'Casing - Pressure', description: 'Shows digital/actual pressure reading on the casing gauge' },
    { value: 'casing_reference', label: 'Casing - Reference', description: 'Shows manual/reference gauge reading for casing baseline' },
    { value: 'tubing_fullview', label: 'Tubing - Full View', description: "Shows complete tubing setup and how it's rigged up" },
    { value: 'tubing_pressure', label: 'Tubing - Pressure', description: 'Shows digital/actual pressure reading on the tubing gauge' },
    { value: 'tubing_reference', label: 'Tubing - Reference', description: 'Shows manual/reference gauge reading for tubing baseline' },
    { value: 'overview', label: 'Overview', description: 'General site or well overview photo' },
    { value: 'signage', label: 'Signage', description: 'Well identification signs and markers' },
    { value: 'equipment', label: 'Equipment', description: 'Tools and equipment used on site' },
  ] as CategoryDefinition[],
  VALID_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VALID_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

export const RuntimeConfig = {
  debug: false,
  autoSaveEnabled: true,
  compressionEnabled: true,
  exifExtractionEnabled: true,
};

export const Features = {
  enableGPSExtraction: true,
  enableLongLagDetection: true,
  enableAutoOptimization: true,
  enableBatchProcessing: true,
  enableProjectManagement: true,
};
