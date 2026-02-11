'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportIssue } from '@/lib/export-validation';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface ExportValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: ExportIssue[];
  onExportAnyway: () => void;
  onFixIssues: () => void;
  exportType: string;
}

export function ExportValidationModal({
  open,
  onOpenChange,
  issues,
  onExportAnyway,
  onFixIssues,
  exportType,
}: ExportValidationModalProps) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Export Validation
          </DialogTitle>
          <DialogDescription>
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found before {exportType} export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-medium text-red-400">
                <XCircle className="h-4 w-4" />
                Errors ({errors.length})
              </h4>
              {errors.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-md border border-red-900/50 bg-red-950/30 p-3"
                >
                  <p className="text-sm">{issue.message}</p>
                  {issue.affectedPhotoIds.length > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {issue.affectedPhotoIds.length} photos affected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Warnings ({warnings.length})
              </h4>
              {warnings.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-md border border-amber-900/50 bg-amber-950/30 p-3"
                >
                  <p className="text-sm">{issue.message}</p>
                  {issue.affectedPhotoIds.length > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {issue.affectedPhotoIds.length} photos affected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {issues.length === 0 && (
            <div className="flex items-center gap-2 rounded-md bg-green-950/30 p-4 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">All checks passed!</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFixIssues}>
            Fix Issues
          </Button>
          <Button
            onClick={onExportAnyway}
            variant={errors.length > 0 ? 'destructive' : 'default'}
          >
            Export Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
