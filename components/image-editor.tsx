'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Photo } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageEditorProps {
  photo: Photo;
  onClose: () => void;
}

export function ImageEditor({ photo, onClose }: ImageEditorProps) {
  const updatePhoto = useAppStore((s) => s.updatePhoto);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Crop state
  const [cropping, setCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    const rw = sw * cos + sh * sin;
    const rh = sw * sin + sh * cos;

    // Fit into max 800x600 preview
    const scale = Math.min(800 / rw, 600 / rh, 1);
    canvas.width = rw * scale;
    canvas.height = rh * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -sw * scale / 2, -sh * scale / 2, sw * scale, sh * scale);
    ctx.restore();

    // Draw crop overlay
    if (cropRect) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.restore();
    }
  }, [rotation, flipH, flipV, cropRect]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      drawPreview();
    } else {
      img.onload = drawPreview;
    }
  }, [drawPreview]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!cropping) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setCropRect(null);
    },
    [cropping]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!cropping || !cropStart) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
      setCropEnd({ x, y });
      setCropRect({
        x: Math.min(cropStart.x, x),
        y: Math.min(cropStart.y, y),
        w: Math.abs(x - cropStart.x),
        h: Math.abs(y - cropStart.y),
      });
    },
    [cropping, cropStart]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (!cropping) return;
    setCropStart(null);
  }, [cropping]);

  // Touch handlers for mobile crop
  const getCanvasPoint = useCallback((touch: React.Touch) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(Math.max(touch.clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(touch.clientY - rect.top, 0), rect.height),
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!cropping || e.touches.length !== 1) return;
      e.preventDefault();
      const pt = getCanvasPoint(e.touches[0]);
      if (!pt) return;
      setCropStart(pt);
      setCropEnd(pt);
      setCropRect(null);
    },
    [cropping, getCanvasPoint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!cropping || !cropStart || e.touches.length !== 1) return;
      e.preventDefault();
      const pt = getCanvasPoint(e.touches[0]);
      if (!pt) return;
      setCropEnd(pt);
      setCropRect({
        x: Math.min(cropStart.x, pt.x),
        y: Math.min(cropStart.y, pt.y),
        w: Math.abs(pt.x - cropStart.x),
        h: Math.abs(pt.y - cropStart.y),
      });
    },
    [cropping, cropStart, getCanvasPoint]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!cropping) return;
      e.preventDefault();
      setCropStart(null);
    },
    [cropping]
  );

  const handleSave = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setIsSaving(true);

    try {
      const offscreen = document.createElement('canvas');
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));

      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const rw = sw * cos + sh * sin;
      const rh = sw * sin + sh * cos;

      offscreen.width = rw;
      offscreen.height = rh;

      ctx.translate(rw / 2, rh / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -sw / 2, -sh / 2);

      let finalCanvas = offscreen;

      // Apply crop if set
      if (cropRect && canvasRef.current) {
        const preview = canvasRef.current;
        const scaleX = rw / preview.width;
        const scaleY = rh / preview.height;
        const cx = cropRect.x * scaleX;
        const cy = cropRect.y * scaleY;
        const cw = cropRect.w * scaleX;
        const ch = cropRect.h * scaleY;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cw;
        cropCanvas.height = ch;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCtx.drawImage(offscreen, cx, cy, cw, ch, 0, 0, cw, ch);
          finalCanvas = cropCanvas;
        }
      }

      const webpUrl = finalCanvas.toDataURL('image/webp', 0.85);
      const jpegUrl = finalCanvas.toDataURL('image/jpeg', 0.85);

      // Estimate size from dataUrl
      const dataUrlSize = Math.round((webpUrl.length * 3) / 4);

      updatePhoto(photo.id, {
        dataUrl: webpUrl,
        jpegUrl,
        size: dataUrlSize,
        metadata: {
          ...photo.metadata,
          width: finalCanvas.width,
          height: finalCanvas.height,
          megapixels: ((finalCanvas.width * finalCanvas.height) / 1_000_000).toFixed(1),
          aspectRatio: `${finalCanvas.width}:${finalCanvas.height}`,
        },
      });

      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [rotation, flipH, flipV, cropRect, photo, updatePhoto, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={`Edit photo: ${photo.name}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Edit: {photo.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => { setCropping(!cropping); setCropRect(null); }}
          >
            {cropping ? 'Cancel Crop' : 'Crop'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setRotation((r) => r - 90)}
            aria-label="Rotate counter-clockwise"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setRotation((r) => r + 90)}
            aria-label="Rotate clockwise"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setFlipH((f) => !f)}
            aria-label="Flip horizontal"
          >
            <FlipHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setFlipV((f) => !f)}
            aria-label="Flip vertical"
          >
            <FlipVertical className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close editor"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Rotation slider */}
      <div className="flex items-center gap-3 px-6 py-2 bg-black/60">
        <span className="text-white/60 text-xs w-16">Rotation</span>
        <Slider
          value={[rotation]}
          min={0}
          max={360}
          step={15}
          onValueChange={([v]) => setRotation(v)}
          className="flex-1 max-w-xs"
        />
        <span className="text-white/60 text-xs w-10 text-right">{rotation}&deg;</span>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {/* Hidden source image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={photo.dataUrl || photo.jpegUrl}
          alt=""
          className="hidden"
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full ${cropping ? 'cursor-crosshair' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/80">
        <Button variant="outline" onClick={onClose} className="border-zinc-700">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-600 text-white hover:bg-amber-700"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
