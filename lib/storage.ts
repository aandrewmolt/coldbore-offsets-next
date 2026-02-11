import { CONFIG } from '@/lib/config';
import { Photo, Well, GPSLocation, SavedProject, ProjectData } from '@/lib/types';
import { savePhotoBinaries, loadPhotoBinaries, clearAllPhotoBinaries } from '@/lib/indexed-db';

function compressPhotosForStorage(photos: Photo[]): Partial<Photo>[] {
  return photos.map((photo) => ({
    id: photo.id,
    name: photo.name,
    originalName: photo.originalName,
    size: photo.size,
    originalSize: photo.originalSize,
    well: photo.well,
    category: photo.category,
    notes: photo.notes,
    hasLongLag: photo.hasLongLag,
    captureDateTime: photo.captureDateTime,
    uploadedAt: photo.uploadedAt,
    sortOrder: photo.sortOrder,
    metadata: photo.metadata
      ? {
          width: photo.metadata.width,
          height: photo.metadata.height,
          camera: photo.metadata.camera,
          location: photo.metadata.location,
          aspectRatio: photo.metadata.aspectRatio,
          megapixels: photo.metadata.megapixels,
          captureDate: photo.metadata.captureDate,
          orientation: null,
          exposureTime: photo.metadata.exposureTime,
          fNumber: photo.metadata.fNumber,
          iso: photo.metadata.iso,
          focalLength: photo.metadata.focalLength,
          flash: null,
          software: null,
        }
      : undefined,
  }));
}

export async function saveToLocalStorage(data: {
  photos: Photo[];
  wells: Well[];
  wellLocations: Record<string, GPSLocation>;
  projectInfo: { clientName: string; jobName: string; jobDateTime: Date | null; projectNotes: string };
  totalOriginalSize: number;
  totalOptimizedSize: number;
}): Promise<boolean> {
  try {
    const projectData = {
      version: '2.0',
      client: data.projectInfo.clientName,
      job: data.projectInfo.jobName,
      datetime: data.projectInfo.jobDateTime?.toISOString() || '',
      notes: data.projectInfo.projectNotes,
      wells: data.wells,
      wellLocations: data.wellLocations,
      photos: compressPhotosForStorage(data.photos),
      totalOriginalSize: data.totalOriginalSize,
      totalOptimizedSize: data.totalOptimizedSize,
      savedAt: new Date().toISOString(),
    };
    const storageKey = `${CONFIG.STORAGE_KEY_PREFIX}current_project`;
    localStorage.setItem(storageKey, JSON.stringify(projectData));

    // Save image binaries to IndexedDB
    await savePhotoBinaries(
      data.photos
        .filter((p) => p.dataUrl || p.jpegUrl)
        .map((p) => ({ id: p.id, dataUrl: p.dataUrl, jpegUrl: p.jpegUrl }))
    );

    return true;
  } catch (error) {
    console.error('Save error:', error);
    return false;
  }
}

export async function loadFromLocalStorage(): Promise<ProjectData | null> {
  try {
    const storageKey = `${CONFIG.STORAGE_KEY_PREFIX}current_project`;
    const dataString = localStorage.getItem(storageKey);
    if (!dataString) return null;
    const data: ProjectData = JSON.parse(dataString);

    // Reattach image binaries from IndexedDB
    if (data.photos && data.photos.length > 0) {
      const ids = data.photos.map((p) => p.id);
      const binaries = await loadPhotoBinaries(ids);
      data.photos = data.photos.map((photo) => {
        const binary = binaries.get(photo.id);
        if (binary) {
          return { ...photo, dataUrl: binary.dataUrl, jpegUrl: binary.jpegUrl };
        }
        return photo;
      });
    }

    return data;
  } catch (error) {
    console.error('Load error:', error);
    return null;
  }
}

export async function saveProject(
  name: string,
  data: {
    photos: Photo[];
    wells: Well[];
    wellLocations: Record<string, GPSLocation>;
    projectInfo: { clientName: string; jobName: string; jobDateTime: Date | null; projectNotes: string };
    totalOriginalSize: number;
    totalOptimizedSize: number;
  }
): Promise<string | null> {
  try {
    const projectId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const projectData = {
      id: projectId,
      name,
      client: data.projectInfo.clientName,
      job: data.projectInfo.jobName,
      datetime: data.projectInfo.jobDateTime?.toISOString() || '',
      notes: data.projectInfo.projectNotes,
      wells: data.wells,
      wellLocations: data.wellLocations,
      photos: compressPhotosForStorage(data.photos),
      totalOriginalSize: data.totalOriginalSize,
      totalOptimizedSize: data.totalOptimizedSize,
      savedAt: new Date().toISOString(),
    };
    const projectsKey = `${CONFIG.STORAGE_KEY_PREFIX}projects`;
    const existingProjects: SavedProject[] = JSON.parse(localStorage.getItem(projectsKey) || '[]');
    const existingIndex = existingProjects.findIndex((p) => p.name === name);
    if (existingIndex !== -1) {
      existingProjects[existingIndex] = {
        id: existingProjects[existingIndex].id,
        name,
        client: projectData.client,
        job: projectData.job,
        photoCount: projectData.photos.length,
        wellCount: projectData.wells.length,
        savedAt: projectData.savedAt,
      };
    } else {
      existingProjects.push({
        id: projectId,
        name,
        client: projectData.client,
        job: projectData.job,
        photoCount: projectData.photos.length,
        wellCount: projectData.wells.length,
        savedAt: projectData.savedAt,
      });
    }
    localStorage.setItem(projectsKey, JSON.stringify(existingProjects));
    const saveId = existingIndex !== -1 ? existingProjects[existingIndex].id : projectId;
    localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}project_${saveId}`, JSON.stringify(projectData));

    // Save binaries to IndexedDB
    await savePhotoBinaries(
      data.photos
        .filter((p) => p.dataUrl || p.jpegUrl)
        .map((p) => ({ id: p.id, dataUrl: p.dataUrl, jpegUrl: p.jpegUrl }))
    );

    return saveId;
  } catch (error) {
    console.error('Save project error:', error);
    return null;
  }
}

export async function loadProjectById(projectId: string): Promise<ProjectData | null> {
  try {
    const projectKey = `${CONFIG.STORAGE_KEY_PREFIX}project_${projectId}`;
    const raw = localStorage.getItem(projectKey);
    if (!raw) return null;
    const data: ProjectData = JSON.parse(raw);

    // Reattach binaries
    if (data.photos && data.photos.length > 0) {
      const ids = data.photos.map((p) => p.id);
      const binaries = await loadPhotoBinaries(ids);
      data.photos = data.photos.map((photo) => {
        const binary = binaries.get(photo.id);
        if (binary) {
          return { ...photo, dataUrl: binary.dataUrl, jpegUrl: binary.jpegUrl };
        }
        return photo;
      });
    }

    return data;
  } catch (error) {
    console.error('Load project error:', error);
    return null;
  }
}

export function getSavedProjects(): SavedProject[] {
  try {
    const projectsKey = `${CONFIG.STORAGE_KEY_PREFIX}projects`;
    const projects: SavedProject[] = JSON.parse(localStorage.getItem(projectsKey) || '[]');
    projects.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return projects;
  } catch {
    return [];
  }
}

export function deleteProject(projectId: string): boolean {
  try {
    const projectsKey = `${CONFIG.STORAGE_KEY_PREFIX}projects`;
    const projects: SavedProject[] = JSON.parse(localStorage.getItem(projectsKey) || '[]');
    localStorage.setItem(projectsKey, JSON.stringify(projects.filter((p) => p.id !== projectId)));
    localStorage.removeItem(`${CONFIG.STORAGE_KEY_PREFIX}project_${projectId}`);
    return true;
  } catch {
    return false;
  }
}

export function exportProjectJSON(data: {
  photos: Photo[];
  wells: Well[];
  wellLocations: Record<string, GPSLocation>;
  projectInfo: { clientName: string; jobName: string; jobDateTime: Date | null; projectNotes: string };
}): void {
  const projectData = {
    version: '2.0',
    exported: new Date().toISOString(),
    ...data,
  };
  const dataStr = JSON.stringify(projectData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ShearFrac_${data.projectInfo.clientName}_${data.projectInfo.jobName}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getStorageUsage(): { used: number; usedMB: string; percentUsed: number } {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += (localStorage[key]?.length || 0) + key.length;
    }
  }
  return {
    used: total,
    usedMB: (total / (1024 * 1024)).toFixed(2),
    percentUsed: Math.round((total / (5 * 1024 * 1024)) * 100),
  };
}

export async function clearAllStorage(): Promise<void> {
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(CONFIG.STORAGE_KEY_PREFIX));
  keys.forEach((key) => localStorage.removeItem(key));
  await clearAllPhotoBinaries();
}
