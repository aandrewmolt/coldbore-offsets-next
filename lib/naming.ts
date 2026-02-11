export const CATEGORY_ABBREV: Record<string, string> = {
  casing_fullview: 'CSG-FV',
  casing_pressure: 'CSG-PR',
  casing_reference: 'CSG-RF',
  tubing_fullview: 'TBG-FV',
  tubing_pressure: 'TBG-PR',
  tubing_reference: 'TBG-RF',
  overview: 'OVW',
  signage: 'SGN',
  equipment: 'EQP',
  '': 'UNC',
};

export const RIGUP_CATEGORY_ABBREV: Record<string, string> = {
  pressure_gauge: 'PRG',
  well_fullview: 'WFV',
  all_wells: 'ALW',
  box_install: 'BOX',
  starlink: 'STR',
  reels: 'REL',
  wellside: 'WSD',
  pad_overview: 'POV',
  pumps: 'PMP',
  other: 'OTH',
  '': 'UNC',
};

export function generateSmartName(
  file: File,
  client: string,
  job: string,
  datetime: Date,
  captureDate: Date | null,
  counter: number
): string {
  const date = captureDate || datetime;
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const clientPrefix = client.substring(0, 3).toUpperCase();
  const jobPrefix = job.substring(0, 3).toUpperCase();
  const photoNum = String(counter).padStart(4, '0');
  return `${clientPrefix}_${jobPrefix}_${dateStr}_${photoNum}.webp`;
}

export function generatePhotoName(
  client: string,
  job: string,
  well: string,
  category: string,
  captureDateTime: Date | string,
  photoIndex: number,
  categoryAbbrev?: Record<string, string>
): string {
  const abbrev = categoryAbbrev ?? CATEGORY_ABBREV;
  const clientPrefix = client.substring(0, 3).toUpperCase();
  const jobPrefix = job.substring(0, 3).toUpperCase();
  const wellPrefix = (well || 'UNK').substring(0, 3).toUpperCase();
  const categoryTag = abbrev[category] || 'UNC';
  const date = new Date(captureDateTime);
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const photoNum = String(photoIndex).padStart(4, '0');
  return `${clientPrefix}_${jobPrefix}_${wellPrefix}_${categoryTag}_${dateStr}_${photoNum}.webp`;
}
