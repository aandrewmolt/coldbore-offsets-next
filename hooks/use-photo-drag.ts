'use client';

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';

export function usePhotoDrag(photoId: string) {
  const reorderPhotos = useAppStore((s) => s.reorderPhotos);
  const sortBy = useAppStore((s) => s.sortBy);
  const dragRef = useRef<HTMLDivElement>(null);

  const isCustomSort = sortBy === 'custom';

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!isCustomSort) return;
      e.dataTransfer.setData('text/plain', photoId);
      e.dataTransfer.effectAllowed = 'move';
      if (dragRef.current) {
        dragRef.current.style.opacity = '0.5';
      }
    },
    [photoId, isCustomSort]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isCustomSort) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragRef.current) {
        dragRef.current.style.borderColor = '#3b82f6';
      }
    },
    [isCustomSort]
  );

  const onDragLeave = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.style.borderColor = '';
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isCustomSort) return;
      e.preventDefault();
      const fromId = e.dataTransfer.getData('text/plain');
      if (fromId && fromId !== photoId) {
        reorderPhotos(fromId, photoId);
      }
      if (dragRef.current) {
        dragRef.current.style.borderColor = '';
      }
    },
    [photoId, reorderPhotos, isCustomSort]
  );

  const onDragEnd = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.style.opacity = '1';
      dragRef.current.style.borderColor = '';
    }
  }, []);

  return {
    dragRef,
    isCustomSort,
    dragHandlers: isCustomSort
      ? { draggable: true, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }
      : {},
  };
}
