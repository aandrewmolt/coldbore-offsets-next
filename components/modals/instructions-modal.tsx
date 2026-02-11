'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface InstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstructionsModal({ open, onOpenChange }: InstructionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">ShearFRAC Instructions</DialogTitle>
          <DialogDescription>
            Field photo management for oil and gas operations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h3 className="mb-1 font-semibold text-foreground">Getting Started</h3>
            <ol className="list-inside list-decimal space-y-1">
              <li>Fill in the <strong>Project Information</strong> (client name, job/lease, date)</li>
              <li>Add wells using the <strong>Well Manager</strong></li>
              <li>Upload photos via <strong>drag &amp; drop</strong> or the file picker</li>
              <li>Assign each photo to a well and category</li>
              <li>Export as PowerPoint or Complete Package (ZIP)</li>
            </ol>
          </section>

          <Separator />

          <section>
            <h3 className="mb-1 font-semibold text-foreground">Photo Categories</h3>
            <ul className="list-inside list-disc space-y-1">
              <li><strong>Casing - Full View:</strong> Complete casing setup and rigging</li>
              <li><strong>Casing - Pressure:</strong> Digital/actual pressure reading on casing gauge</li>
              <li><strong>Casing - Reference:</strong> Manual/reference gauge reading for casing baseline</li>
              <li><strong>Tubing - Full View:</strong> Complete tubing setup and rigging</li>
              <li><strong>Tubing - Pressure:</strong> Digital/actual pressure reading on tubing gauge</li>
              <li><strong>Tubing - Reference:</strong> Manual/reference gauge reading for tubing baseline</li>
              <li><strong>Overview:</strong> General site or well overview</li>
              <li><strong>Signage:</strong> Well identification signs and markers</li>
              <li><strong>Equipment:</strong> Tools and equipment used on site</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h3 className="mb-1 font-semibold text-foreground">Batch Operations</h3>
            <p>Select multiple photos using checkboxes, then use the batch toolbar to assign wells, categories, or delete in bulk. Hold <strong>Shift</strong> and click to select a range.</p>
          </section>

          <Separator />

          <section>
            <h3 className="mb-1 font-semibold text-foreground">Keyboard Shortcuts</h3>
            <ul className="list-inside list-disc space-y-1">
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl+S</kbd> Save project</li>
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl+O</kbd> Open saved projects</li>
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl+E</kbd> Scroll to export</li>
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl+F</kbd> Focus search</li>
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Escape</kbd> Close dialogs</li>
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">F1</kbd> Show instructions</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h3 className="mb-1 font-semibold text-foreground">Image Viewer Controls</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>Mouse wheel to zoom in/out</li>
              <li>Click and drag to pan (when zoomed)</li>
              <li>Arrow keys to navigate between photos</li>
              <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">R</kbd> Rotate, <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">0</kbd> Reset, <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">+/-</kbd> Zoom</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h3 className="mb-1 font-semibold text-foreground">Auto-Save</h3>
            <p>Your work is automatically saved every 60 seconds. You can also manually save with <strong>Ctrl+S</strong> or use the export options to save named projects.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
