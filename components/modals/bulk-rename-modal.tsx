'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BulkRenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function applyTemplate(
  template: string,
  photo: { well: string; category: string; captureDateTime: Date; client: string; job: string },
  index: number
): string {
  const d = new Date(photo.captureDateTime);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');

  return template
    .replace(/\{well\}/gi, photo.well || 'unassigned')
    .replace(/\{category\}/gi, photo.category || 'uncat')
    .replace(/\{###\}/g, pad3(index + 1))
    .replace(/\{##\}/g, pad2(index + 1))
    .replace(/\{date\}/gi, `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`)
    .replace(/\{time\}/gi, `${pad2(d.getHours())}${pad2(d.getMinutes())}`)
    .replace(/\{client\}/gi, photo.client || 'client')
    .replace(/\{job\}/gi, photo.job || 'job');
}

export function BulkRenameModal({ open, onOpenChange }: BulkRenameModalProps) {
  const selectedPhotos = useAppStore((s) => s.selectedPhotos);
  const photos = useAppStore((s) => s.photos);
  const updatePhoto = useAppStore((s) => s.updatePhoto);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const [template, setTemplate] = useState('{well}_{category}_{###}');

  const selected = useMemo(
    () => photos.filter((p) => selectedPhotos.has(p.id)),
    [photos, selectedPhotos]
  );

  const preview = useMemo(() => {
    return selected.slice(0, 5).map((photo, i) => ({
      old: photo.name,
      new: applyTemplate(template, photo, i),
    }));
  }, [selected, template]);

  const handleRename = () => {
    selected.forEach((photo, i) => {
      const newName = applyTemplate(template, photo, i);
      updatePhoto(photo.id, { name: newName });
    });
    toast.success(`Renamed ${selected.length} photo${selected.length !== 1 ? 's' : ''}`);
    clearSelection();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename {selected.length} Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Template</label>
            <Input
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="{well}_{category}_{###}"
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Tokens: {'{well}'} {'{category}'} {'{###}'} {'{##}'} {'{date}'} {'{time}'} {'{client}'} {'{job}'}
            </p>
          </div>

          {preview.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Preview</label>
              <div className="rounded border border-border bg-muted/30 p-2 space-y-1">
                {preview.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="truncate text-muted-foreground">{p.old}</span>
                    <span className="text-muted-foreground shrink-0">&rarr;</span>
                    <span className="truncate font-medium">{p.new}</span>
                  </div>
                ))}
                {selected.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">...and {selected.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleRename}
            disabled={!template.trim()}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
