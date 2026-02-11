'use client';

import { useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
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
import { useAppStore } from '@/lib/store';
import { loadFromLocalStorage } from '@/lib/storage';
import { useCategories } from '@/lib/category-context';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function RigUpPage() {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const photos = useAppStore((s) => s.photos);
  const hydrate = useAppStore((s) => s.hydrate);
  const { storagePrefix } = useCategories();

  const openInstructions = useCallback(() => setInstructionsOpen(true), []);
  const openProjectModal = useCallback(() => setProjectModalOpen(true), []);

  useKeyboardShortcuts({ openInstructions, openProjectModal });
  useAutoSave();

  useEffect(() => { document.title = 'ShearFRAC - Rig Up Photos'; }, []);

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
          <>
            {/* Mobile filter button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="gap-1.5"
                aria-label="Open filters and sorting"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filters & Sort
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <aside className="hidden lg:block">
                <PhotoSidebar />
              </aside>
              <PhotoGrid />
            </div>
            {/* Mobile sidebar sheet */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="w-[300px] overflow-y-auto p-4">
                <SheetHeader>
                  <SheetTitle>Filters & Sort</SheetTitle>
                  <SheetDescription>Filter, search, and sort your photos</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <PhotoSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </>
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
