'use client';

import { Upload, CheckSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useFilteredPhotos } from '@/hooks/use-photo-filter';
import { useLazyVisible } from '@/hooks/use-lazy-visible';
import { PhotoCard } from '@/components/photo-card';
import { PhotoCardSkeleton } from '@/components/photo-card-skeleton';
import { FilterPresets } from '@/components/filter-presets';
import { Photo } from '@/lib/types';

function LazyPhotoCard({ photo }: { photo: Photo }) {
  const { ref, isVisible } = useLazyVisible('200px');

  return (
    <div ref={ref}>
      {isVisible ? <PhotoCard photo={photo} /> : <PhotoCardSkeleton />}
    </div>
  );
}

export function PhotoGrid() {
  const filteredPhotos = useFilteredPhotos();
  const totalPhotos = useAppStore((s) => s.photos.length);
  const isProcessing = useAppStore((s) => s.isProcessing);
  const processingCount = useAppStore((s) => s.processingCount);
  const selectAllFiltered = useAppStore((s) => s.selectAllFiltered);

  return (
    <div className="flex flex-col gap-4">
      <FilterPresets />
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {filteredPhotos.length}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">{totalPhotos}</span>{' '}
          photos
        </p>
        {filteredPhotos.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => selectAllFiltered(filteredPhotos.map((p) => p.id))}
            data-select-all-visible
          >
            <CheckSquare className="mr-1 h-3 w-3" />
            Select All Visible
          </Button>
        )}
      </div>

      {filteredPhotos.length === 0 && !isProcessing ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Upload className="size-10 opacity-40" />
          <p className="text-sm">
            {totalPhotos === 0
              ? 'No photos uploaded yet'
              : 'No photos match the current filters'}
          </p>
        </div>
      ) : (
        <div className="photo-grid">
          {isProcessing &&
            Array.from({ length: processingCount }, (_, i) => (
              <PhotoCardSkeleton key={`skeleton-${i}`} />
            ))}
          {filteredPhotos.map((photo) => (
            <LazyPhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
