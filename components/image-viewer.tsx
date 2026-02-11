'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Camera,
  AlertTriangle,
  Crop,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatFileSize, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CONFIG } from '@/lib/config';
import { ImageEditor } from '@/components/image-editor';

export function ImageViewer() {
  const viewerPhotoId = useAppStore((s) => s.viewerPhotoId);
  const photos = useAppStore((s) => s.photos);
  const getPhotoById = useAppStore((s) => s.getPhotoById);
  const setViewerPhotoId = useAppStore((s) => s.setViewerPhotoId);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const touchStartDistance = useRef(0);
  const touchStartZoom = useRef(1);
  const swipeStartX = useRef(0);

  const photo = viewerPhotoId ? getPhotoById(viewerPhotoId) : undefined;

  const currentIndex = viewerPhotoId
    ? photos.findIndex((p) => p.id === viewerPhotoId)
    : -1;

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  }, []);

  const close = useCallback(() => {
    setViewerPhotoId(null);
    resetTransform();
  }, [setViewerPhotoId, resetTransform]);

  const navigatePrev = useCallback(() => {
    if (currentIndex > 0) {
      setViewerPhotoId(photos[currentIndex - 1].id);
      resetTransform();
    }
  }, [currentIndex, photos, setViewerPhotoId, resetTransform]);

  const navigateNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setViewerPhotoId(photos[currentIndex + 1].id);
      resetTransform();
    }
  }, [currentIndex, photos, setViewerPhotoId, resetTransform]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - 0.25, 0.5);
      if (next <= 1) {
        setPanX(0);
        setPanY(0);
      }
      return next;
    });
  }, []);

  const rotate = useCallback(() => {
    setRotation((r) => r + 90);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!viewerPhotoId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          close();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigatePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateNext();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          rotate();
          break;
        case '0':
          e.preventDefault();
          resetTransform();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerPhotoId, close, navigatePrev, navigateNext, zoomIn, zoomOut, rotate, resetTransform]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(z + 0.15, 5));
      } else {
        setZoom((z) => {
          const next = Math.max(z - 0.15, 0.5);
          if (next <= 1) {
            setPanX(0);
            setPanY(0);
          }
          return next;
        });
      }
    },
    []
  );

  // Click-drag pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { x: panX, y: panY };
    },
    [zoom, panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || zoom <= 1) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPanX(panStart.current.x + dx);
      setPanY(panStart.current.y + dy);
    },
    [isDragging, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Overlay background click to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        close();
      }
    },
    [close]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance.current = Math.hypot(dx, dy);
        touchStartZoom.current = zoom;
      } else if (e.touches.length === 1 && zoom <= 1) {
        swipeStartX.current = e.touches[0].clientX;
      }
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.hypot(dx, dy);
        const ratio = distance / touchStartDistance.current;
        setZoom(Math.min(Math.max(touchStartZoom.current * ratio, 0.5), 5));
      }
    },
    [isPinching]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (isPinching) {
        setIsPinching(false);
        return;
      }
      if (e.changedTouches.length === 1 && zoom <= 1) {
        const delta = e.changedTouches[0].clientX - swipeStartX.current;
        if (Math.abs(delta) > 80) {
          if (delta > 0) {
            navigatePrev();
          } else {
            navigateNext();
          }
        }
      }
    },
    [isPinching, zoom, navigatePrev, navigateNext]
  );

  if (!viewerPhotoId || !photo) return null;

  const location = photo.manualLocation || photo.metadata.location;
  const categoryDef = CONFIG.PHOTO_CATEGORIES.find(
    (c) => c.value === photo.category
  );
  const categoryLabel = categoryDef?.label || photo.category || 'Unassigned';

  return (
    <div className="image-viewer-overlay flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white font-medium truncate text-sm">
            {photo.name}
          </span>
          <span className="text-white/50 text-xs">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={zoomOut}
            title="Zoom out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white/70 text-xs w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={zoomIn}
            title="Zoom in (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={rotate}
            title="Rotate (R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
            onClick={resetTransform}
            title="Reset (0)"
          >
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setEditMode(true)}
            title="Edit photo"
          >
            <Crop className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={close}
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image display area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden select-none"
        onClick={handleOverlayClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: isPinching ? 'none' : 'auto',
        }}
      >
        {/* Previous button */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 z-10 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12"
            onClick={(e) => {
              e.stopPropagation();
              navigatePrev();
            }}
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Image */}
        <img
          src={photo.dataUrl || photo.jpegUrl}
          alt={photo.name}
          className="max-h-full max-w-full object-contain pointer-events-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          draggable={false}
        />

        {/* Next button */}
        {currentIndex < photos.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 z-10 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12"
            onClick={(e) => {
              e.stopPropagation();
              navigateNext();
            }}
            title="Next (Right Arrow)"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-black/60 text-white/70 text-xs overflow-x-auto">
        {photo.well && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <MapPin className="h-3 w-3" />
            {photo.well}
          </span>
        )}
        <span className="whitespace-nowrap">{categoryLabel}</span>
        <span className="whitespace-nowrap">{formatFileSize(photo.size)}</span>
        {photo.metadata.camera && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Camera className="h-3 w-3" />
            {photo.metadata.camera}
          </span>
        )}
        {location && (
          <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 whitespace-nowrap text-blue-400 hover:text-blue-300"
          >
            <MapPin className="h-3 w-3" />
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </a>
        )}
        {photo.captureDateTime && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {formatDate(photo.captureDateTime)}
          </span>
        )}
        {photo.hasLongLag && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 text-[10px] px-1.5 py-0"
          >
            <AlertTriangle className="h-3 w-3" />
            Long Lag
          </Badge>
        )}
      </div>

      {editMode && (
        <ImageEditor
          photo={photo}
          onClose={() => setEditMode(false)}
        />
      )}
    </div>
  );
}
