import { Photo, Well } from '@/lib/types';

export interface ExportIssue {
  type: 'no-well' | 'no-category' | 'no-tech-name' | 'duplicate-name' | 'long-lag';
  severity: 'error' | 'warning';
  message: string;
  affectedPhotoIds: string[];
}

export function validateExport(
  photos: Photo[],
  wells: Well[],
  techName: string
): { issues: ExportIssue[] } {
  const issues: ExportIssue[] = [];

  // Tech name missing
  if (!techName.trim()) {
    issues.push({
      type: 'no-tech-name',
      severity: 'error',
      message: 'Tech name is required for export',
      affectedPhotoIds: [],
    });
  }

  // Photos without well assignment
  const noWell = photos.filter((p) => !p.well);
  if (noWell.length > 0) {
    issues.push({
      type: 'no-well',
      severity: 'error',
      message: `${noWell.length} photo${noWell.length !== 1 ? 's' : ''} without well assignment`,
      affectedPhotoIds: noWell.map((p) => p.id),
    });
  }

  // Photos without category
  const noCategory = photos.filter((p) => !p.category);
  if (noCategory.length > 0) {
    issues.push({
      type: 'no-category',
      severity: 'error',
      message: `${noCategory.length} photo${noCategory.length !== 1 ? 's' : ''} without category`,
      affectedPhotoIds: noCategory.map((p) => p.id),
    });
  }

  // Duplicate photo names
  const nameMap = new Map<string, string[]>();
  for (const p of photos) {
    const existing = nameMap.get(p.name) || [];
    existing.push(p.id);
    nameMap.set(p.name, existing);
  }
  const duplicateIds: string[] = [];
  for (const [, ids] of nameMap) {
    if (ids.length > 1) duplicateIds.push(...ids);
  }
  if (duplicateIds.length > 0) {
    issues.push({
      type: 'duplicate-name',
      severity: 'warning',
      message: `${duplicateIds.length} photos have duplicate names`,
      affectedPhotoIds: duplicateIds,
    });
  }

  // Long-lag photos
  const longLag = photos.filter((p) => p.hasLongLag);
  if (longLag.length > 0) {
    issues.push({
      type: 'long-lag',
      severity: 'warning',
      message: `${longLag.length} photo${longLag.length !== 1 ? 's' : ''} flagged as long lag`,
      affectedPhotoIds: longLag.map((p) => p.id),
    });
  }

  return { issues };
}
