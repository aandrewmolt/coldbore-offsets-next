import { create } from 'zustand';
import { Photo, Well, ProjectInfo, CurrentFilter, GPSLocation } from './types';

interface AppStore {
  // Photo data
  photos: Photo[];
  photoCounter: number;

  // Wells data
  wells: Well[];
  wellLocations: Record<string, GPSLocation>;

  // Filters
  currentFilter: CurrentFilter;
  sortBy: string;

  // UI state
  selectedPhotos: Set<string>;
  isProcessing: boolean;
  processingProgress: number;
  processingCount: number;

  // Project info
  projectInfo: ProjectInfo;

  // Statistics
  totalOriginalSize: number;
  totalOptimizedSize: number;

  // Auto-save
  lastSaveTime: Date | null;
  unsavedChanges: boolean;
  saveStatus: 'idle' | 'saved' | 'failed';
  dirtyPhotoIds: Set<string>;

  // Image viewer
  viewerPhotoId: string | null;

  // Tech name for export
  techName: string;

  // Actions
  addPhoto: (photo: Photo) => void;
  removePhoto: (photoId: string) => void;
  updatePhoto: (photoId: string, updates: Partial<Photo>) => void;
  getPhotoById: (photoId: string) => Photo | undefined;

  addWell: (wellName: string) => void;
  removeWell: (wellName: string) => void;
  setWellLocation: (wellName: string, location: GPSLocation) => void;

  setFilter: (filterType: keyof CurrentFilter, value: string) => void;
  clearFilters: () => void;
  setSortBy: (sort: string) => void;

  togglePhotoSelection: (photoId: string) => void;
  selectPhotoRange: (photoId: string, filteredPhotos: Photo[]) => void;
  clearSelection: () => void;

  batchAssignWell: (wellName: string) => void;
  batchAssignCategory: (category: string) => void;
  batchDelete: () => void;

  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  setTechName: (name: string) => void;

  setProcessing: (processing: boolean, progress?: number, count?: number) => void;
  setViewerPhotoId: (id: string | null) => void;

  hasDuplicate: (name: string, size: number) => boolean;
  reorderPhotos: (fromId: string, toId: string) => void;

  selectAllFiltered: (filteredPhotoIds: string[]) => void;

  markSaved: () => void;
  markSaveFailed: () => void;
  clearDirtyPhotos: () => void;

  reset: () => void;

  getStatistics: () => {
    totalPhotos: number;
    organizedPhotos: number;
    unassignedPhotos: number;
    totalWells: number;
    spaceSaved: number;
  };

  // Hydrate from saved data
  hydrate: (data: {
    photos: Photo[];
    wells: Well[];
    wellLocations: Record<string, GPSLocation>;
    projectInfo: Partial<ProjectInfo>;
    totalOriginalSize: number;
    totalOptimizedSize: number;
  }) => void;
}

const initialProjectInfo: ProjectInfo = {
  clientName: '',
  jobName: '',
  jobDateTime: new Date(),
  projectNotes: '',
};

export const useAppStore = create<AppStore>((set, get) => ({
  photos: [],
  photoCounter: 1,
  wells: [],
  wellLocations: {},
  currentFilter: { well: '', category: '', search: '' },
  sortBy: 'name',
  selectedPhotos: new Set<string>(),
  isProcessing: false,
  processingProgress: 0,
  processingCount: 0,
  projectInfo: { ...initialProjectInfo },
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
  lastSaveTime: null,
  unsavedChanges: false,
  saveStatus: 'idle',
  dirtyPhotoIds: new Set<string>(),
  viewerPhotoId: null,
  techName: '',

  addPhoto: (photo) => set((state) => {
    const dirty = new Set(state.dirtyPhotoIds);
    dirty.add(photo.id);
    return {
      photos: [...state.photos, { ...photo, sortOrder: photo.sortOrder ?? state.photos.length }],
      photoCounter: state.photoCounter + 1,
      totalOriginalSize: state.totalOriginalSize + (photo.originalSize || 0),
      totalOptimizedSize: state.totalOptimizedSize + (photo.size || 0),
      unsavedChanges: true,
      dirtyPhotoIds: dirty,
    };
  }),

  removePhoto: (photoId) => set((state) => {
    const photo = state.photos.find((p) => p.id === photoId);
    const next = new Set(state.selectedPhotos);
    next.delete(photoId);
    return {
      photos: state.photos.filter((p) => p.id !== photoId),
      selectedPhotos: next,
      totalOriginalSize: state.totalOriginalSize - (photo?.originalSize || 0),
      totalOptimizedSize: state.totalOptimizedSize - (photo?.size || 0),
      unsavedChanges: true,
    };
  }),

  updatePhoto: (photoId, updates) => set((state) => {
    const dirty = state.dirtyPhotoIds;
    const hasImageChange = 'dataUrl' in updates || 'jpegUrl' in updates;
    return {
      photos: state.photos.map((p) => (p.id === photoId ? { ...p, ...updates } : p)),
      unsavedChanges: true,
      dirtyPhotoIds: hasImageChange ? new Set([...dirty, photoId]) : dirty,
    };
  }),

  getPhotoById: (photoId) => get().photos.find((p) => p.id === photoId),

  addWell: (wellName) => set((state) => {
    if (state.wells.some((w) => w.name === wellName)) return state;
    return {
      wells: [...state.wells, { name: wellName, count: 0 }],
      unsavedChanges: true,
    };
  }),

  removeWell: (wellName) => set((state) => {
    const { [wellName]: _, ...remainingLocations } = state.wellLocations;
    return {
      wells: state.wells.filter((w) => w.name !== wellName),
      photos: state.photos.map((p) => (p.well === wellName ? { ...p, well: '' } : p)),
      wellLocations: remainingLocations,
      unsavedChanges: true,
    };
  }),

  setWellLocation: (wellName, location) => set((state) => ({
    wellLocations: { ...state.wellLocations, [wellName]: location },
    unsavedChanges: true,
  })),

  setFilter: (filterType, value) => set((state) => ({
    currentFilter: { ...state.currentFilter, [filterType]: value },
  })),

  clearFilters: () => set({ currentFilter: { well: '', category: '', search: '' } }),

  setSortBy: (sort) => set({ sortBy: sort }),

  togglePhotoSelection: (photoId) => set((state) => {
    const next = new Set(state.selectedPhotos);
    if (next.has(photoId)) {
      next.delete(photoId);
    } else {
      next.add(photoId);
    }
    return { selectedPhotos: next };
  }),

  selectPhotoRange: (photoId, filteredPhotos) => set((state) => {
    const next = new Set(state.selectedPhotos);
    const lastSelected = Array.from(state.selectedPhotos).pop();
    if (!lastSelected) {
      next.add(photoId);
      return { selectedPhotos: next };
    }
    const ids = filteredPhotos.map((p) => p.id);
    const startIdx = ids.indexOf(lastSelected);
    const endIdx = ids.indexOf(photoId);
    if (startIdx === -1 || endIdx === -1) {
      next.add(photoId);
      return { selectedPhotos: next };
    }
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    for (let i = from; i <= to; i++) {
      next.add(ids[i]);
    }
    return { selectedPhotos: next };
  }),

  clearSelection: () => set({ selectedPhotos: new Set<string>() }),
  selectAllFiltered: (filteredPhotoIds) => set({ selectedPhotos: new Set(filteredPhotoIds) }),

  batchAssignWell: (wellName) => set((state) => ({
    photos: state.photos.map((p) =>
      state.selectedPhotos.has(p.id) ? { ...p, well: wellName } : p
    ),
    selectedPhotos: new Set<string>(),
    unsavedChanges: true,
  })),

  batchAssignCategory: (category) => set((state) => ({
    photos: state.photos.map((p) =>
      state.selectedPhotos.has(p.id) ? { ...p, category } : p
    ),
    selectedPhotos: new Set<string>(),
    unsavedChanges: true,
  })),

  batchDelete: () => set((state) => ({
    photos: state.photos.filter((p) => !state.selectedPhotos.has(p.id)),
    selectedPhotos: new Set<string>(),
    unsavedChanges: true,
  })),

  setProjectInfo: (info) => set((state) => ({
    projectInfo: { ...state.projectInfo, ...info },
    unsavedChanges: true,
  })),

  setTechName: (name) => set({ techName: name }),

  setProcessing: (processing, progress, count) => set((state) => ({
    isProcessing: processing,
    processingProgress: progress ?? 0,
    processingCount: count ?? (processing ? state.processingCount : 0),
  })),

  setViewerPhotoId: (id) => set({ viewerPhotoId: id }),

  markSaved: () => set({ lastSaveTime: new Date(), unsavedChanges: false, saveStatus: 'saved' }),
  markSaveFailed: () => set({ saveStatus: 'failed' }),
  clearDirtyPhotos: () => set({ dirtyPhotoIds: new Set<string>() }),

  hasDuplicate: (name, size) => {
    return get().photos.some((p) => p.originalName === name && p.originalSize === size);
  },

  reorderPhotos: (fromId, toId) => set((state) => {
    const photos = [...state.photos];
    const fromIndex = photos.findIndex((p) => p.id === fromId);
    const toIndex = photos.findIndex((p) => p.id === toId);
    if (fromIndex === -1 || toIndex === -1) return state;
    const [moved] = photos.splice(fromIndex, 1);
    photos.splice(toIndex, 0, moved);
    return {
      photos: photos.map((p, i) => ({ ...p, sortOrder: i })),
      unsavedChanges: true,
    };
  }),

  reset: () => set({
    photos: [],
    photoCounter: 1,
    wells: [],
    wellLocations: {},
    currentFilter: { well: '', category: '', search: '' },
    sortBy: 'name',
    selectedPhotos: new Set<string>(),
    isProcessing: false,
    processingProgress: 0,
    processingCount: 0,
    projectInfo: { ...initialProjectInfo, jobDateTime: new Date() },
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    lastSaveTime: null,
    unsavedChanges: false,
    saveStatus: 'idle',
    dirtyPhotoIds: new Set<string>(),
    viewerPhotoId: null,
    techName: '',
  }),

  getStatistics: () => {
    const state = get();
    return {
      totalPhotos: state.photos.length,
      organizedPhotos: state.photos.filter((p) => p.well && p.category).length,
      unassignedPhotos: state.photos.filter((p) => !p.well || !p.category).length,
      totalWells: state.wells.length,
      spaceSaved: state.totalOriginalSize - state.totalOptimizedSize,
    };
  },

  hydrate: (data) => set({
    photos: data.photos,
    wells: data.wells,
    wellLocations: data.wellLocations,
    projectInfo: { ...initialProjectInfo, ...data.projectInfo },
    totalOriginalSize: data.totalOriginalSize,
    totalOptimizedSize: data.totalOptimizedSize,
    unsavedChanges: false,
  }),
}));
