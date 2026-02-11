'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, XCircle, Pause, Play } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function UploadZone() {
  const isProcessing = useAppStore((s) => s.isProcessing);
  const processingProgress = useAppStore((s) => s.processingProgress);
  const { processFiles, cancel, togglePause, isPaused } = usePhotoUpload();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone itself, not a child
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset so the same files can be selected again
    e.target.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload photos. Click or drag and drop image files here."
          onClick={openFilePicker}
          onKeyDown={handleKeyDown}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
            isDragOver
              ? 'border-[#D4A017] bg-amber-950/20'
              : 'border-zinc-700 bg-zinc-950/30 hover:border-zinc-600 hover:bg-zinc-950/50'
          } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Upload
            className={`mb-3 h-10 w-10 ${
              isDragOver ? 'text-[#D4A017]' : 'text-zinc-500'
            }`}
          />
          <p className="mb-1 text-sm font-medium text-zinc-300">
            {isDragOver ? 'Drop photos here' : 'Drag and drop photos'}
          </p>
          <p className="mb-3 text-xs text-zinc-500">
            or click to browse -- JPEG, PNG, GIF, WebP
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={(e) => {
                e.stopPropagation();
                openCamera();
              }}
              tabIndex={-1}
              disabled={isProcessing}
            >
              <Camera className="mr-1.5 h-4 w-4" />
              Take Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              tabIndex={-1}
              disabled={isProcessing}
            >
              Select Files
            </Button>
          </div>
        </div>

        {/* Processing progress */}
        {isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{isPaused ? 'Paused' : 'Processing photos...'}</span>
              <div className="flex items-center gap-2">
                <span>{processingProgress}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200"
                  onClick={togglePause}
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  onClick={cancel}
                  title="Cancel upload"
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Progress
              value={processingProgress}
              className="h-2 bg-zinc-800 [&>div]:bg-amber-600"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
