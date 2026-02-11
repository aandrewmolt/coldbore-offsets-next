'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/lib/store';
import { CONFIG } from '@/lib/config';
import { Layers, Tag, Trash2, X, Pencil } from 'lucide-react';
import { BulkRenameModal } from '@/components/modals/bulk-rename-modal';

export function BatchToolbar() {
  const selectedPhotos = useAppStore((s) => s.selectedPhotos);
  const wells = useAppStore((s) => s.wells);
  const batchAssignWell = useAppStore((s) => s.batchAssignWell);
  const batchAssignCategory = useAppStore((s) => s.batchAssignCategory);
  const batchDelete = useAppStore((s) => s.batchDelete);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const [wellDialogOpen, setWellDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedWell, setSelectedWell] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const count = selectedPhotos.size;
  if (count === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur animate-in slide-in-from-bottom-2">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground">{count} selected</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWellDialogOpen(true)} disabled={wells.length === 0}>
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              Assign Well
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              Assign Category
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRenameDialogOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Rename
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Assign Well Dialog */}
      <Dialog open={wellDialogOpen} onOpenChange={setWellDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Well to {count} Photos</DialogTitle>
          </DialogHeader>
          <Select value={selectedWell} onValueChange={setSelectedWell}>
            <SelectTrigger>
              <SelectValue placeholder="Select well..." />
            </SelectTrigger>
            <SelectContent>
              {wells.map((w) => (
                <SelectItem key={w.name} value={w.name}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWellDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedWell) {
                  batchAssignWell(selectedWell);
                  setWellDialogOpen(false);
                  setSelectedWell('');
                }
              }}
              disabled={!selectedWell}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Category to {count} Photos</DialogTitle>
          </DialogHeader>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {CONFIG.PHOTO_CATEGORIES.filter((c) => c.value).map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedCategory) {
                  batchAssignCategory(selectedCategory);
                  setCategoryDialogOpen(false);
                  setSelectedCategory('');
                }
              }}
              disabled={!selectedCategory}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} Photos</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {count} selected photo{count !== 1 ? 's' : ''} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                batchDelete();
                setDeleteDialogOpen(false);
              }}
            >
              Delete {count} Photos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Rename */}
      <BulkRenameModal open={renameDialogOpen} onOpenChange={setRenameDialogOpen} />
    </>
  );
}
