'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { getSavedProjects, loadProjectById, deleteProject, loadFromLocalStorage } from '@/lib/storage';
import { SavedProject } from '@/lib/types';
import { toast } from 'sonner';
import { FolderOpen, Trash2, Clock, Camera, Layers } from 'lucide-react';

interface ProjectSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSelectModal({ open, onOpenChange }: ProjectSelectModalProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hasLastSession, setHasLastSession] = useState(false);
  const hydrate = useAppStore((s) => s.hydrate);
  const reset = useAppStore((s) => s.reset);
  const setProjectInfo = useAppStore((s) => s.setProjectInfo);

  useEffect(() => {
    if (open) {
      setProjects(getSavedProjects());
      loadFromLocalStorage().then((lastSession) => {
        setHasLastSession(!!lastSession);
      });
    }
  }, [open]);

  async function handleLoadProject(projectId: string) {
    const data = await loadProjectById(projectId);
    if (!data) {
      toast.error('Failed to load project');
      return;
    }
    reset();
    hydrate({
      photos: data.photos,
      wells: data.wells,
      wellLocations: data.wellLocations,
      projectInfo: {
        clientName: data.client,
        jobName: data.job,
        jobDateTime: data.datetime ? new Date(data.datetime) : null,
        projectNotes: data.notes,
      },
      totalOriginalSize: data.totalOriginalSize,
      totalOptimizedSize: data.totalOptimizedSize,
    });
    toast.success('Project loaded');
    onOpenChange(false);
  }

  async function handleContinueLastSession() {
    const data = await loadFromLocalStorage();
    if (!data) {
      toast.error('No saved session found');
      return;
    }
    reset();
    hydrate({
      photos: data.photos,
      wells: data.wells,
      wellLocations: data.wellLocations,
      projectInfo: {
        clientName: data.client,
        jobName: data.job,
        jobDateTime: data.datetime ? new Date(data.datetime) : null,
        projectNotes: data.notes,
      },
      totalOriginalSize: data.totalOriginalSize,
      totalOptimizedSize: data.totalOptimizedSize,
    });
    toast.success('Session restored');
    onOpenChange(false);
  }

  function handleDeleteProject(projectId: string) {
    deleteProject(projectId);
    setProjects(getSavedProjects());
    setDeleteTarget(null);
    toast.success('Project deleted');
  }

  function handleNewProject() {
    reset();
    setProjectInfo({ jobDateTime: new Date() });
    toast.success('New project started');
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Project Manager
            </DialogTitle>
            <DialogDescription>
              Load a saved project or start a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={handleNewProject} variant="outline" className="flex-1">
                New Project
              </Button>
              {hasLastSession && (
                <Button onClick={handleContinueLastSession} className="flex-1">
                  Continue Last Session
                </Button>
              )}
            </div>

            {projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Saved Projects</h3>
                {projects.map((project) => (
                  <Card key={project.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="min-w-0 flex-1" onClick={() => handleLoadProject(project.id)}>
                        <p className="truncate font-medium">{project.name || 'Unnamed Project'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {project.client && (
                            <Badge variant="secondary" className="text-xs">{project.client}</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            <Camera className="mr-1 h-3 w-3" />
                            {project.photoCount}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Layers className="mr-1 h-3 w-3" />
                            {project.wellCount}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(project.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(project.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {projects.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No saved projects yet
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This project will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTarget && handleDeleteProject(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
