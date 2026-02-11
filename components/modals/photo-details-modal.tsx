'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Photo } from '@/lib/types';
import { formatFileSize } from '@/lib/utils';
import { CONFIG } from '@/lib/config';

interface PhotoDetailsModalProps {
  photo: Photo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoDetailsModal({ photo, open, onOpenChange }: PhotoDetailsModalProps) {
  if (!photo) return null;

  const category = CONFIG.PHOTO_CATEGORIES.find((c) => c.value === photo.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">{photo.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="overflow-hidden rounded-md">
            <img
              src={photo.dataUrl}
              alt={photo.name}
              className="w-full object-contain"
              style={{ maxHeight: '300px' }}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {photo.well && <Badge>{photo.well}</Badge>}
            {category && <Badge variant="secondary">{category.label}</Badge>}
            {photo.hasLongLag && <Badge variant="secondary" className="bg-amber-900/30 text-amber-400">Long Lag</Badge>}
          </div>

          <Separator />

          {/* File Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Original Name</div>
            <div className="truncate">{photo.originalName}</div>
            <div className="text-muted-foreground">File Size</div>
            <div>{formatFileSize(photo.size)} (was {formatFileSize(photo.originalSize)})</div>
            <div className="text-muted-foreground">Resolution</div>
            <div>{photo.metadata.width} x {photo.metadata.height} ({photo.metadata.megapixels} MP)</div>
            <div className="text-muted-foreground">Uploaded</div>
            <div>{new Date(photo.uploadedAt).toLocaleString()}</div>
          </div>

          {/* EXIF Metadata */}
          {(photo.metadata.camera || photo.metadata.captureDate || photo.metadata.location) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {photo.metadata.captureDate && (
                  <>
                    <div className="text-muted-foreground">Capture Date</div>
                    <div>{new Date(photo.metadata.captureDate).toLocaleString()}</div>
                  </>
                )}
                {photo.metadata.camera && (
                  <>
                    <div className="text-muted-foreground">Camera</div>
                    <div>{photo.metadata.camera}</div>
                  </>
                )}
                {photo.metadata.exposureTime && (
                  <>
                    <div className="text-muted-foreground">Exposure</div>
                    <div>{photo.metadata.exposureTime}</div>
                  </>
                )}
                {photo.metadata.fNumber && (
                  <>
                    <div className="text-muted-foreground">Aperture</div>
                    <div>f/{photo.metadata.fNumber}</div>
                  </>
                )}
                {photo.metadata.iso && (
                  <>
                    <div className="text-muted-foreground">ISO</div>
                    <div>{photo.metadata.iso}</div>
                  </>
                )}
                {photo.metadata.focalLength && (
                  <>
                    <div className="text-muted-foreground">Focal Length</div>
                    <div>{photo.metadata.focalLength}</div>
                  </>
                )}
                {photo.metadata.location && (
                  <>
                    <div className="text-muted-foreground">GPS</div>
                    <div>
                      <a
                        href={`https://www.google.com/maps?q=${photo.metadata.location.lat},${photo.metadata.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {photo.metadata.location.string}
                      </a>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {photo.notes && (
            <>
              <Separator />
              <div className="text-sm">
                <div className="mb-1 text-muted-foreground">Notes</div>
                <p>{photo.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
