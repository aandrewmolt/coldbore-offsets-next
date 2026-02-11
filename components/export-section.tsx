'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { saveToLocalStorage } from '@/lib/storage';
import { useCategories } from '@/lib/category-context';
import { validateExport, ExportIssue } from '@/lib/export-validation';
import { ExportValidationModal } from '@/components/modals/export-validation-modal';
import { toast } from 'sonner';
import { Download, FileText, Package, Save, FolderOpen, Loader2 } from 'lucide-react';

interface ExportSectionProps {
  onOpenProjectModal: () => void;
}

export function ExportSection({ onOpenProjectModal }: ExportSectionProps) {
  const store = useAppStore();
  const photos = useAppStore((s) => s.photos);
  const wells = useAppStore((s) => s.wells);
  const techName = useAppStore((s) => s.techName);
  const setTechName = useAppStore((s) => s.setTechName);
  const markSaved = useAppStore((s) => s.markSaved);
  const { storagePrefix, mode, categories } = useCategories();

  const [exporting, setExporting] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ExportIssue[]>([]);
  const [validationOpen, setValidationOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<'pptx' | 'zip' | null>(null);

  async function handleExport(type: 'pptx' | 'zip') {
    if (photos.length === 0) {
      toast.error('No photos to export');
      return;
    }

    const { issues } = validateExport(photos, wells, techName, mode);
    if (issues.length > 0) {
      setValidationIssues(issues);
      setPendingExportType(type);
      setValidationOpen(true);
      return;
    }

    await doExport(type);
  }

  async function doExport(type: string) {
    setExporting(type);
    const exportOptions = { mode, categories };
    try {
      if (type === 'pptx') {
        const { exportPowerPoint } = await import('@/lib/export-pptx');
        await exportPowerPoint(useAppStore.getState(), exportOptions);
        toast.success('PowerPoint exported successfully');
      } else if (type === 'zip') {
        const { exportZip } = await import('@/lib/export-zip');
        await exportZip(useAppStore.getState(), exportOptions);
        toast.success('Complete package exported');
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  }

  async function handleSave() {
    try {
      const success = await saveToLocalStorage(store, storagePrefix);
      if (success) {
        markSaved();
        toast.success('Project saved');
      } else {
        toast.error('Save failed - storage may be full');
      }
    } catch {
      toast.error('Save failed - storage may be full');
    }
  }

  return (
    <>
      <Card id="export-section">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Export & Save
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tech-name">Tech Name (Required for Export)</Label>
            <Input
              id="tech-name"
              placeholder="Enter your name"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => handleExport('pptx')}
              disabled={!!exporting || photos.length === 0}
              className="w-full"
            >
              {exporting === 'pptx' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Export PowerPoint
            </Button>
            <Button
              onClick={() => handleExport('zip')}
              disabled={!!exporting || photos.length === 0}
              variant="secondary"
              className="w-full"
            >
              {exporting === 'zip' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Package className="mr-2 h-4 w-4" />
              )}
              Complete Package
            </Button>
            <Button onClick={handleSave} variant="outline" className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Project
            </Button>
            <Button onClick={onOpenProjectModal} variant="outline" className="w-full">
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Saved
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExportValidationModal
        open={validationOpen}
        onOpenChange={setValidationOpen}
        issues={validationIssues}
        exportType={pendingExportType === 'pptx' ? 'PowerPoint' : 'ZIP'}
        onExportAnyway={() => {
          setValidationOpen(false);
          if (pendingExportType) doExport(pendingExportType);
        }}
        onFixIssues={() => {
          setValidationOpen(false);
        }}
      />
    </>
  );
}
