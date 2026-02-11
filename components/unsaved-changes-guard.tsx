'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function UnsavedChangesGuard() {
  const unsavedChanges = useAppStore((s) => s.unsavedChanges);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedChanges]);

  return null;
}
