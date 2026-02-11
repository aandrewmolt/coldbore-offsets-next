'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { optimizeImage } from '@/lib/image-processor';
import { extractMetadata } from '@/lib/exif';
import { generateSmartName } from '@/lib/naming';
import { generateId, isValidImageFile, detectCategory } from '@/lib/utils';
import { CONFIG } from '@/lib/config';
import { Photo } from '@/lib/types';
import { WorkerPool, supportsOffscreenCanvas } from '@/lib/worker-pool';
import { toast } from 'sonner';

export function usePhotoUpload() {
  const addPhoto = useAppStore((s) => s.addPhoto);
  const setProcessing = useAppStore((s) => s.setProcessing);
  const projectInfo = useAppStore((s) => s.projectInfo);
  const photoCounter = useAppStore((s) => s.photoCounter);
  const hasDuplicate = useAppStore((s) => s.hasDuplicate);
  const photos = useAppStore((s) => s.photos);
  const [isPaused, setIsPaused] = useState(false);
  const poolRef = useRef<WorkerPool | null>(null);
  const abortRef = useRef(false);
  const pauseRef = useRef(false);

  const cancel = useCallback(() => {
    abortRef.current = true;
    if (poolRef.current) {
      poolRef.current.abort();
    }
  }, []);

  const togglePause = useCallback(() => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(isValidImageFile);
    if (validFiles.length === 0) {
      toast.error('No valid image files selected');
      return;
    }

    // Duplicate detection
    const toProcess: File[] = [];
    const duplicates: File[] = [];
    for (const file of validFiles) {
      if (hasDuplicate(file.name, file.size)) {
        duplicates.push(file);
      } else {
        toProcess.push(file);
      }
    }

    if (duplicates.length > 0) {
      toast.warning(
        `Skipped ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''}: ${duplicates.map((f) => f.name).slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`
      );
    }

    if (toProcess.length === 0) {
      return;
    }

    const total = toProcess.length;
    setProcessing(true, 0, total);
    abortRef.current = false;
    pauseRef.current = false;
    setIsPaused(false);
    let processed = 0;
    let counter = photoCounter;
    let batchOriginalSize = 0;
    let batchOptimizedSize = 0;
    const startSortOrder = photos.length;

    const useWorkers = supportsOffscreenCanvas() && total >= 3;
    if (useWorkers) {
      poolRef.current = new WorkerPool();
    }

    // Process in batches
    for (let i = 0; i < total; i += CONFIG.BATCH_SIZE) {
      if (abortRef.current) break;

      // Wait while paused
      while (pauseRef.current && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 200));
      }
      if (abortRef.current) break;

      const batch = toProcess.slice(i, i + CONFIG.BATCH_SIZE);
      await Promise.all(batch.map(async (file) => {
        if (abortRef.current) return;

        try {
          const metadata = await extractMetadata(file);

          let dataUrl: string;
          let jpegUrl: string;
          let size: number;

          if (useWorkers && poolRef.current) {
            const buffer = await file.arrayBuffer();
            const result = await poolRef.current.process({
              id: generateId(),
              imageData: buffer,
              width: 0,
              height: 0,
              maxWidth: CONFIG.MAX_IMAGE_WIDTH,
              maxHeight: CONFIG.MAX_IMAGE_HEIGHT,
              quality: CONFIG.IMAGE_QUALITY,
              orientation: metadata.orientation,
            });
            if (result.error) {
              // Fallback to main thread
              const opt = await optimizeImage(file, metadata.orientation);
              dataUrl = opt.dataUrl;
              jpegUrl = opt.jpegUrl;
              size = opt.size;
            } else {
              dataUrl = result.webpUrl;
              jpegUrl = result.jpegUrl;
              size = result.size;
            }
          } else {
            const opt = await optimizeImage(file, metadata.orientation);
            dataUrl = opt.dataUrl;
            jpegUrl = opt.jpegUrl;
            size = opt.size;
          }

          if (abortRef.current) return;

          const captureDate = metadata.captureDate || new Date(file.lastModified);
          const now = new Date();
          const lagHours = (now.getTime() - captureDate.getTime()) / (1000 * 60 * 60);
          const hasLongLag = lagHours > CONFIG.LAG_THRESHOLD_HOURS;

          const autoCategory = detectCategory(file.name);
          const smartName = generateSmartName(
            file,
            projectInfo.clientName,
            projectInfo.jobName,
            projectInfo.jobDateTime || new Date(),
            captureDate,
            counter++
          );

          const photo: Photo = {
            id: generateId(),
            name: smartName,
            originalName: file.name,
            client: projectInfo.clientName,
            job: projectInfo.jobName,
            well: '',
            category: autoCategory,
            notes: '',
            dataUrl,
            jpegUrl,
            size,
            originalSize: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            uploadedAt: now,
            captureDateTime: captureDate,
            metadata,
            hasLongLag,
            manualLocation: null,
            sortOrder: startSortOrder + processed,
          };

          addPhoto(photo);
          batchOriginalSize += file.size;
          batchOptimizedSize += size;
          processed++;
          setProcessing(true, Math.round((processed / total) * 100));
        } catch (err) {
          console.error('Failed to process:', file.name, err);
          toast.error(`Failed to process: ${file.name}`);
          processed++;
          setProcessing(true, Math.round((processed / total) * 100));
        }
      }));
    }

    // Cleanup worker pool
    if (poolRef.current) {
      poolRef.current.terminate();
      poolRef.current = null;
    }

    setProcessing(false);

    if (abortRef.current) {
      toast.info(`Upload cancelled after ${processed} photo${processed !== 1 ? 's' : ''}`);
      abortRef.current = false;
    } else {
      const savingsPct = batchOriginalSize > 0
        ? Math.round((1 - batchOptimizedSize / batchOriginalSize) * 100)
        : 0;
      const savingsMsg = savingsPct > 0 ? ` (${savingsPct}% smaller with WebP)` : '';
      toast.success(`Uploaded ${processed} photo${processed !== 1 ? 's' : ''}${savingsMsg}`);
    }
  }, [addPhoto, setProcessing, projectInfo, photoCounter, hasDuplicate, photos.length]);

  return { processFiles, cancel, togglePause, isPaused };
}
