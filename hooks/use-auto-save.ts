'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { saveToLocalStorage } from '@/lib/storage';
import { useCategories } from '@/lib/category-context';
import { CONFIG } from '@/lib/config';
import { toast } from 'sonner';

export function useAutoSave() {
  const unsavedChanges = useAppStore((s) => s.unsavedChanges);
  const markSaved = useAppStore((s) => s.markSaved);
  const markSaveFailed = useAppStore((s) => s.markSaveFailed);
  const { storagePrefix } = useCategories();
  const storeRef = useRef(useAppStore.getState());
  const lastFailedRef = useRef(false);

  useEffect(() => {
    storeRef.current = useAppStore.getState();
    return useAppStore.subscribe((state) => {
      storeRef.current = state;
    });
  }, []);

  useEffect(() => {
    if (!unsavedChanges) return;

    const timer = setInterval(async () => {
      const state = storeRef.current;
      if (state.unsavedChanges && state.photos.length > 0) {
        try {
          const success = await saveToLocalStorage(state, storagePrefix);
          if (success) {
            markSaved();
            // Only show toast when recovering from a failure
            if (lastFailedRef.current) {
              toast.success('Auto-save recovered');
              lastFailedRef.current = false;
            }
          } else {
            markSaveFailed();
            if (!lastFailedRef.current) {
              toast.error('Auto-save failed');
              lastFailedRef.current = true;
            }
          }
        } catch {
          markSaveFailed();
          if (!lastFailedRef.current) {
            toast.error('Auto-save failed');
            lastFailedRef.current = true;
          }
        }
      }
    }, CONFIG.AUTO_SAVE_INTERVAL);

    return () => clearInterval(timer);
  }, [unsavedChanges, markSaved, markSaveFailed, storagePrefix]);
}
