'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

const PRESETS = [
  { label: 'All', filter: {} },
  { label: 'Unassigned', filter: { well: '__unassigned', category: '__unassigned' } },
  { label: 'No Well', filter: { well: '__unassigned' } },
  { label: 'No Category', filter: { category: '__unassigned' } },
  { label: 'Flagged', filter: { search: '__flagged' } },
] as const;

type PresetFilter = { well?: string; category?: string; search?: string };

export function FilterPresets() {
  const setFilter = useAppStore((s) => s.setFilter);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const currentFilter = useAppStore((s) => s.currentFilter);

  function applyPreset(preset: PresetFilter) {
    clearFilters();
    if (preset.well) setFilter('well', preset.well);
    if (preset.category) setFilter('category', preset.category);
    if (preset.search) setFilter('search', preset.search);
  }

  function isActive(preset: PresetFilter): boolean {
    if (Object.keys(preset).length === 0) {
      return !currentFilter.well && !currentFilter.category && !currentFilter.search;
    }
    if (preset.well === '__unassigned' && preset.category === '__unassigned') {
      return currentFilter.well === '__unassigned' && currentFilter.category === '__unassigned';
    }
    if (preset.well) return currentFilter.well === preset.well;
    if (preset.category) return currentFilter.category === preset.category;
    if (preset.search) return currentFilter.search === preset.search;
    return false;
  }

  return (
    <div className="flex flex-wrap gap-1.5" data-filter-presets>
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant={isActive(preset.filter) ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            if (Object.keys(preset.filter).length === 0) {
              clearFilters();
            } else {
              applyPreset(preset.filter);
            }
          }}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
