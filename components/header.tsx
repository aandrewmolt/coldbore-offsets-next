'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { formatFileSize } from '@/lib/utils';
import Image from 'next/image';
import { HelpCircle } from 'lucide-react';
import { SaveStatus } from '@/components/save-status';

interface HeaderProps {
  onOpenInstructions: () => void;
}

export function Header({ onOpenInstructions }: HeaderProps) {
  const photos = useAppStore((s) => s.photos);
  const totalOriginalSize = useAppStore((s) => s.totalOriginalSize);
  const totalOptimizedSize = useAppStore((s) => s.totalOptimizedSize);

  const stats = useMemo(() => ({
    totalPhotos: photos.length,
    organizedPhotos: photos.filter((p) => p.well && p.category).length,
    unassignedPhotos: photos.filter((p) => !p.well || !p.category).length,
    spaceSaved: totalOriginalSize - totalOptimizedSize,
  }), [photos, totalOriginalSize, totalOptimizedSize]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <h1 className="flex items-center min-w-0">
          <Image
            src="/shearfrac-logo.webp"
            alt="ShearFRAC"
            width={140}
            height={32}
            className="h-7 w-auto shrink-0"
            priority
          />
        </h1>

        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="secondary">
            {stats.totalPhotos} Photos
          </Badge>
          <Badge variant="secondary" className="bg-green-900/30 text-green-400">
            {stats.organizedPhotos} Organized
          </Badge>
          {stats.unassignedPhotos > 0 && (
            <Badge variant="secondary" className="bg-amber-900/30 text-amber-400">
              {stats.unassignedPhotos} Unassigned
            </Badge>
          )}
          {stats.spaceSaved > 0 && (
            <Badge variant="secondary" className="bg-blue-900/30 text-blue-400">
              {formatFileSize(stats.spaceSaved)} Saved
            </Badge>
          )}
          <SaveStatus />
        </div>

        <Button variant="ghost" size="sm" onClick={onOpenInstructions} title="Instructions (F1)">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Instructions</span>
        </Button>
      </div>
    </header>
  );
}
