'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { saveToLocalStorage } from '@/lib/storage';
import { useCategories } from '@/lib/category-context';
import { toast } from 'sonner';

export function useKeyboardShortcuts(callbacks: {
  openInstructions: () => void;
  openProjectModal: () => void;
}) {
  const store = useAppStore();
  const { storagePrefix } = useCategories();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            saveToLocalStorage(store, storagePrefix).then((success) => {
              if (success) toast.success('Project saved');
              else toast.error('Save failed');
            });
            break;
          case 'o':
            e.preventDefault();
            callbacks.openProjectModal();
            break;
          case 'e':
            e.preventDefault();
            document.getElementById('export-section')?.scrollIntoView({ behavior: 'smooth' });
            break;
          case 'f':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        callbacks.openInstructions();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, callbacks, storagePrefix]);
}
