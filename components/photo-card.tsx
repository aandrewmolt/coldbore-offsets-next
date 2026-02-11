'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Eye, Download, Trash2 } from 'lucide-react';
import { Photo } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { useAppStore } from '@/lib/store';
import { useCategories } from '@/lib/category-context';
import { useFilteredPhotos } from '@/hooks/use-photo-filter';
import { usePhotoDrag } from '@/hooks/use-photo-drag';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PhotoDetailsModal } from '@/components/modals/photo-details-modal';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PhotoCardProps {
  photo: Photo;
}

export function PhotoCard({ photo }: PhotoCardProps) {
  const wells = useAppStore((s) => s.wells);
  const selectedPhotos = useAppStore((s) => s.selectedPhotos);
  const togglePhotoSelection = useAppStore((s) => s.togglePhotoSelection);
  const selectPhotoRange = useAppStore((s) => s.selectPhotoRange);
  const updatePhoto = useAppStore((s) => s.updatePhoto);
  const removePhoto = useAppStore((s) => s.removePhoto);
  const setViewerPhotoId = useAppStore((s) => s.setViewerPhotoId);
  const filteredPhotos = useFilteredPhotos();
  const { categories } = useCategories();

  const { dragRef, dragHandlers, isCustomSort } = usePhotoDrag(photo.id);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isSelected = selectedPhotos.has(photo.id);
  const needsAttention = photo.well === '' || photo.category === '';

  const [notesValue, setNotesValue] = useState(photo.notes);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local notes state when photo.notes changes externally
  useEffect(() => {
    setNotesValue(photo.notes);
  }, [photo.notes]);

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotesValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updatePhoto(photo.id, { notes: value });
      }, CONFIG.DEBOUNCE_DELAY);
    },
    [photo.id, updatePhoto]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.shiftKey) {
        selectPhotoRange(photo.id, filteredPhotos);
      } else {
        togglePhotoSelection(photo.id);
      }
    },
    [photo.id, filteredPhotos, selectPhotoRange, togglePhotoSelection]
  );

  const handleImageClick = useCallback(() => {
    setViewerPhotoId(photo.id);
  }, [photo.id, setViewerPhotoId]);

  const handleDownload = useCallback(() => {
    const url = photo.dataUrl || photo.jpegUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = photo.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [photo]);

  const handleDelete = useCallback(() => {
    removePhoto(photo.id);
  }, [photo.id, removePhoto]);

  return (
    <>
    <Card
      data-photo-card
      ref={dragRef}
      {...dragHandlers}
      className={`relative overflow-hidden p-0 transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${needsAttention ? 'border-amber-500/60' : ''} ${isCustomSort ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Image area */}
      <div className="relative">
        <div
          className="aspect-[4/3] cursor-pointer overflow-hidden"
          onClick={handleImageClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.dataUrl || photo.jpegUrl}
            alt={photo.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>

        {/* Selection checkbox overlay */}
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onClick={handleCheckboxClick}
            onChange={() => {}}
            className="size-4 cursor-pointer rounded border-white/60 bg-black/40 accent-blue-500"
          />
        </div>

        {/* Lag badge */}
        {photo.hasLongLag && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="border-amber-500/60 bg-amber-500/20 text-amber-400 text-xs">
              Lag
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="space-y-2.5 p-3">
        {/* Photo name and size */}
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-sm font-medium cursor-pointer hover:text-primary"
            title={photo.name}
            onClick={() => setDetailsOpen(true)}
          >
            {photo.name}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {photo.originalSize > 0 && photo.size < photo.originalSize && (
              <Badge variant="secondary" className="bg-green-900/40 text-green-400 text-[10px]">
                WebP -{Math.round((1 - photo.size / photo.originalSize) * 100)}%
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {formatFileSize(photo.size)}
            </Badge>
          </div>
        </div>

        {/* Well assignment */}
        <Select
          value={photo.well || undefined}
          onValueChange={(value) =>
            updatePhoto(photo.id, { well: value === '__none__' ? '' : value })
          }
        >
          <SelectTrigger size="sm" className="w-full text-xs">
            <SelectValue placeholder="Assign well..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unassigned</SelectItem>
            {wells.map((w) => (
              <SelectItem key={w.name} value={w.name}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category assignment */}
        <TooltipProvider delayDuration={300}>
          <Select
            value={photo.category || undefined}
            onValueChange={(value) =>
              updatePhoto(photo.id, {
                category: value === '__none__' ? '' : value,
              })
            }
          >
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue placeholder="Assign category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <Tooltip key={cat.value || '__none__'}>
                  <TooltipTrigger asChild>
                    <SelectItem value={cat.value || '__none__'}>
                      {cat.label}
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p className="text-xs">{cat.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </SelectContent>
          </Select>
        </TooltipProvider>

        {/* Notes */}
        <Input
          placeholder="Notes..."
          value={notesValue}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="h-7 text-xs"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleImageClick}
            title="View photo"
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDownload}
            title="Download photo"
          >
            <Download className="size-3.5" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                title="Delete photo"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{photo.name}&quot; from the
                  project. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
    <PhotoDetailsModal photo={photo} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}
