'use client';

import { useMemo } from 'react';
import { Search, X, CheckCircle2, Circle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useFilteredPhotos } from '@/hooks/use-photo-filter';
import { useCategories } from '@/lib/category-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
  { value: 'size', label: 'Size' },
  { value: 'well', label: 'Well' },
  { value: 'category', label: 'Category' },
  { value: 'lag', label: 'Lag' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'custom', label: 'Custom Order' },
] as const;

export function PhotoSidebar() {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const sortBy = useAppStore((s) => s.sortBy);
  const wells = useAppStore((s) => s.wells);
  const photos = useAppStore((s) => s.photos);
  const setFilter = useAppStore((s) => s.setFilter);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const setSortBy = useAppStore((s) => s.setSortBy);
  const filteredPhotos = useFilteredPhotos();
  const { categories, mode } = useCategories();

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of photos) {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return counts;
  }, [photos]);

  const wellCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of photos) {
      if (p.well) {
        counts[p.well] = (counts[p.well] || 0) + 1;
      }
    }
    return counts;
  }, [photos]);

  const hasActiveFilter =
    currentFilter.search !== '' ||
    currentFilter.well !== '' ||
    currentFilter.category !== '';

  const getCategoryLabel = (value: string) => {
    const cat = categories.find((c) => c.value === value);
    return cat?.label ?? value;
  };

  return (
    <aside className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search-input"
          placeholder="Search photos..."
          value={currentFilter.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

      {/* Well filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Well</label>
        <Select
          value={currentFilter.well || '__all__'}
          onValueChange={(value) =>
            setFilter('well', value === '__all__' ? '' : value)
          }
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="All Wells" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Wells</SelectItem>
            {wells.map((w) => (
              <SelectItem key={w.name} value={w.name}>
                {w.name} ({wellCounts[w.name] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Category
        </label>
        <Select
          value={currentFilter.category || '__all__'}
          onValueChange={(value) =>
            setFilter('category', value === '__all__' ? '' : value)
          }
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.filter((c) => c.value !== '').map(
              (cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label} ({categoryCounts[cat.value] || 0})
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Sort by */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Sort by
        </label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasActiveFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full gap-1.5"
        >
          <X className="size-3.5" />
          Clear filters
        </Button>
      )}

      {/* Category completion checklist */}
      {photos.length > 0 && (
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {mode === 'rigup' ? 'Photo Checklist' : 'Category Coverage'}
          </p>
          <div className="space-y-0.5">
            {categories.filter((c) => c.value !== '').map((cat) => {
              const count = categoryCounts[cat.value] || 0;
              const hasPhotos = count > 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilter('category', currentFilter.category === cat.value ? '' : cat.value)}
                  className={`flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:bg-muted/50 ${
                    currentFilter.category === cat.value ? 'bg-muted' : ''
                  }`}
                >
                  {hasPhotos ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-amber-500" />
                  )}
                  <span className={hasPhotos ? 'text-foreground' : 'text-amber-400'}>
                    {cat.label}
                  </span>
                  {count > 0 && (
                    <span className="ml-auto text-muted-foreground">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact photo list */}
      <div className="flex-1 space-y-1 overflow-y-auto border-t pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Photos ({filteredPhotos.length})
        </p>
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/50"
          >
            <div className="size-10 shrink-0 overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl || photo.jpegUrl}
                alt={photo.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{photo.name}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {photo.well && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 text-[10px] leading-none"
                  >
                    {photo.well}
                  </Badge>
                )}
                {photo.category && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] leading-none"
                  >
                    {getCategoryLabel(photo.category)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
