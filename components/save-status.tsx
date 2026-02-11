'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function SaveStatus() {
  const lastSaveTime = useAppStore((s) => s.lastSaveTime);
  const unsavedChanges = useAppStore((s) => s.unsavedChanges);
  const saveStatus = useAppStore((s) => s.saveStatus);
  const [, setTick] = useState(0);

  // Update relative time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (saveStatus === 'failed') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="h-3 w-3" />
        Save failed
      </span>
    );
  }

  if (unsavedChanges) {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-400">
        <Circle className="h-3 w-3 fill-current" />
        Unsaved changes
      </span>
    );
  }

  if (lastSaveTime) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        Saved {getRelativeTime(lastSaveTime)}
      </span>
    );
  }

  return null;
}
