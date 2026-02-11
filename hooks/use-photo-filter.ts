import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Photo, SortField } from '@/lib/types';

function filterPhotos(photos: Photo[], filter: { well: string; category: string; search: string }): Photo[] {
  return photos.filter((photo) => {
    if (filter.well) {
      if (filter.well === '__unassigned') {
        if (photo.well) return false;
      } else if (photo.well !== filter.well) {
        return false;
      }
    }
    if (filter.category) {
      if (filter.category === '__unassigned') {
        if (photo.category) return false;
      } else if (filter.category === 'casing') {
        if (!photo.category.startsWith('casing_')) return false;
      } else if (filter.category === 'tubing') {
        if (!photo.category.startsWith('tubing_')) return false;
      } else if (photo.category !== filter.category) {
        return false;
      }
    }
    if (filter.search) {
      if (filter.search === '__flagged') {
        if (!photo.hasLongLag) return false;
      } else {
        const q = filter.search.toLowerCase();
        const searchable = [photo.name, photo.well, photo.category, photo.notes, photo.originalName].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
    }
    return true;
  });
}

function sortPhotos(photos: Photo[], sortBy: SortField): Photo[] {
  const sorted = [...photos];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.captureDateTime).getTime() - new Date(a.captureDateTime).getTime();
      case 'size':
        return b.size - a.size;
      case 'well':
        return (a.well || 'zzz').localeCompare(b.well || 'zzz');
      case 'category':
        return (a.category || 'zzz').localeCompare(b.category || 'zzz');
      case 'lag':
        return (b.hasLongLag ? 1 : 0) - (a.hasLongLag ? 1 : 0);
      case 'resolution': {
        const aRes = (a.metadata?.width || 0) * (a.metadata?.height || 0);
        const bRes = (b.metadata?.width || 0) * (b.metadata?.height || 0);
        return bRes - aRes;
      }
      case 'custom':
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      default:
        return 0;
    }
  });
  return sorted;
}

export function useFilteredPhotos(): Photo[] {
  const photos = useAppStore((s) => s.photos);
  const currentFilter = useAppStore((s) => s.currentFilter);
  const sortBy = useAppStore((s) => s.sortBy) as SortField;

  return useMemo(() => {
    const filtered = filterPhotos(photos, currentFilter);
    return sortPhotos(filtered, sortBy);
  }, [photos, currentFilter, sortBy]);
}
