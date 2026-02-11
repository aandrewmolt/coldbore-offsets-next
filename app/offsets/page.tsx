'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/header';
import { ProjectInfo } from '@/components/project-info';
import { WellManager } from '@/components/well-manager';
import { UploadZone } from '@/components/upload-zone';
import { PhotoGrid } from '@/components/photo-grid';
import { PhotoSidebar } from '@/components/photo-sidebar';
import { ImageViewer } from '@/components/image-viewer';
import { ExportSection } from '@/components/export-section';
import { BatchToolbar } from '@/components/batch-toolbar';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';
import { InstructionsModal } from '@/components/modals/instructions-modal';
import { ProjectSelectModal } from '@/components/modals/project-select-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { useAppStore } from '@/lib/store';
import { loadFromLocalStorage } from '@/lib/storage';
import { useCategories } from '@/lib/category-context';
import { toast } from 'sonner';

export default function OffsetsPage() {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const photos = useAppStore((s) => s.photos);
  const hydrate = useAppStore((s) => s.hydrate);
  const { storagePrefix } = useCategories();

  const openInstructions = useCallback(() => setInstructionsOpen(true), []);
  const openProjectModal = useCallback(() => setProjectModalOpen(true), []);

  useKeyboardShortcuts({ openInstructions, openProjectModal });
  useAutoSave();
  useServiceWorker();

  // Auto-restore last session on mount
  useEffect(() => {
    async function restore() {
      const saved = await loadFromLocalStorage(storagePrefix);
      if (saved && saved.photos.length > 0) {
        hydrate({
          photos: saved.photos,
          wells: saved.wells,
          wellLocations: saved.wellLocations,
          projectInfo: {
            clientName: saved.client,
            jobName: saved.job,
            jobDateTime: saved.datetime ? new Date(saved.datetime) : null,
            projectNotes: saved.notes,
          },
          totalOriginalSize: saved.totalOriginalSize,
          totalOptimizedSize: saved.totalOptimizedSize,
        });
        toast.success(`Restored ${saved.photos.length} photos from last session`);
      }
    }
    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPhotos = photos.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <UnsavedChangesGuard />
      <Header onOpenInstructions={openInstructions} />

      <main id="main-content" className="container mx-auto flex-1 space-y-6 px-4 py-6">
        {/* Project Setup Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectInfo />
          <WellManager />
        </div>

        {/* Upload Section */}
        <UploadZone />

        {/* Workspace - only visible when photos exist */}
        {hasPhotos && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <PhotoSidebar />
            </aside>
            <PhotoGrid />
          </div>
        )}

        {/* Export Section - only visible when photos exist */}
        {hasPhotos && (
          <ExportSection onOpenProjectModal={openProjectModal} />
        )}
      </main>

      {/* Overlays */}
      <ImageViewer />
      <BatchToolbar />
      <InstructionsModal open={instructionsOpen} onOpenChange={setInstructionsOpen} />
      <ProjectSelectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
    </div>
  );
}
