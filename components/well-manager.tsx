'use client';

import { useState, useMemo } from 'react';
import { Layers, X, Plus, MapPin, ListPlus, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { parseMapUrl } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { WellMapWrapper } from '@/components/well-map-wrapper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GPSLocation } from '@/lib/types';

export function WellManager() {
  const wells = useAppStore((s) => s.wells);
  const photos = useAppStore((s) => s.photos);
  const wellLocations = useAppStore((s) => s.wellLocations);
  const currentFilter = useAppStore((s) => s.currentFilter);
  const addWell = useAppStore((s) => s.addWell);
  const removeWell = useAppStore((s) => s.removeWell);
  const setWellLocation = useAppStore((s) => s.setWellLocation);
  const setFilter = useAppStore((s) => s.setFilter);

  const [newWellName, setNewWellName] = useState('');
  const [quickAddNames, setQuickAddNames] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [expandedWell, setExpandedWell] = useState<string | null>(null);
  const [locationInputs, setLocationInputs] = useState<Record<string, string>>({});
  const [locationStatus, setLocationStatus] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [showManualCoords, setShowManualCoords] = useState<Record<string, boolean>>({});

  // Compute photo counts per well
  const photoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const photo of photos) {
      if (photo.well) {
        counts[photo.well] = (counts[photo.well] || 0) + 1;
      }
    }
    return counts;
  }, [photos]);

  function handleAddWell() {
    const trimmed = newWellName.trim();
    if (!trimmed) return;
    addWell(trimmed);
    setNewWellName('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleAddWell();
    }
  }

  function handleQuickAdd() {
    const names = quickAddNames
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) {
      addWell(name);
    }
    setQuickAddNames('');
    setQuickAddOpen(false);
  }

  function handleFilterByWell(wellName: string) {
    if (currentFilter.well === wellName) {
      setFilter('well', '');
    } else {
      setFilter('well', wellName);
    }
  }

  function handleLocationInput(wellName: string, value: string) {
    setLocationInputs((prev) => ({ ...prev, [wellName]: value }));
    if (!value.trim()) {
      setLocationStatus((prev) => {
        const next = { ...prev };
        delete next[wellName];
        return next;
      });
      return;
    }
    const result = parseMapUrl(value);
    if (!result) {
      setLocationStatus((prev) => {
        const next = { ...prev };
        delete next[wellName];
        return next;
      });
      return;
    }
    if ('error' in result) {
      setLocationStatus((prev) => ({ ...prev, [wellName]: { type: 'error', message: result.error } }));
      return;
    }
    // Success - set coordinates
    const location: GPSLocation = {
      lat: result.lat,
      lng: result.lng,
      string: `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`,
    };
    setWellLocation(wellName, location);
    setLocationStatus((prev) => ({
      ...prev,
      [wellName]: { type: 'success', message: `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}` },
    }));
    toast.success(`GPS set for ${wellName}`);
  }

  function handleLocationChange(
    wellName: string,
    field: 'lat' | 'lng',
    value: string
  ) {
    const num = parseFloat(value);
    if (isNaN(num)) return;

    const existing = wellLocations[wellName];
    const lat = field === 'lat' ? num : existing?.lat ?? 0;
    const lng = field === 'lng' ? num : existing?.lng ?? 0;

    const location: GPSLocation = {
      lat,
      lng,
      string: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
    setWellLocation(wellName, location);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Wells ({wells.length})
            </h3>
          </div>
          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <ListPlus className="mr-1 h-3.5 w-3.5" />
                Quick Add
              </Button>
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-zinc-900">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  Quick Add Wells
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Enter well names separated by commas to add them all at once.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="e.g. Smith 1-14H, Jones 2-8H, Baker 3-21H"
                value={quickAddNames}
                onChange={(e) => setQuickAddNames(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                }}
                className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setQuickAddOpen(false)}
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickAdd}
                  disabled={!quickAddNames.trim()}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  Add Wells
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Single well add input */}
        <div className="flex gap-2">
          <Input
            placeholder="Well name..."
            value={newWellName}
            onChange={(e) => setNewWellName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 border-zinc-700 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500"
          />
          <Button
            size="sm"
            onClick={handleAddWell}
            disabled={!newWellName.trim()}
            className="h-8 bg-amber-600 px-3 text-white hover:bg-amber-700"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Well badges */}
        {wells.length === 0 ? (
          <p className="py-2 text-center text-xs text-zinc-500">
            No wells added yet
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {wells.map((well) => {
              const count = photoCounts[well.name] || 0;
              const isActive = currentFilter.well === well.name;

              return (
                <div key={well.name} className="flex flex-col gap-1">
                  <div className="flex items-center gap-0.5">
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={`cursor-pointer select-none text-xs transition-colors ${
                        isActive
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      aria-label={`Filter by well ${well.name} (${count} photos)`}
                      onClick={() => handleFilterByWell(well.name)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFilterByWell(well.name); } }}
                    >
                      {well.name}
                      <span className="ml-1 opacity-60">({count})</span>
                    </Badge>

                    {/* Location toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-5 w-5 p-0 min-h-[44px] min-w-[44px] ${
                        expandedWell === well.name
                          ? 'text-amber-500'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      onClick={() =>
                        setExpandedWell(
                          expandedWell === well.name ? null : well.name
                        )
                      }
                      aria-label={`Set location for ${well.name}`}
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>

                    {/* Remove well with confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="inline-flex h-5 w-5 min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-red-900/30 hover:text-red-400"
                          aria-label={`Remove well ${well.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-zinc-800 bg-zinc-900">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-zinc-100">
                            Remove Well
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to remove{' '}
                            <span className="font-medium text-zinc-200">
                              {well.name}
                            </span>
                            ? This will unassign {count} photo
                            {count !== 1 ? 's' : ''} from this well.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeWell(well.name)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* GPS location inputs */}
                  {expandedWell === well.name && (
                    <div className="ml-1 space-y-1.5 rounded border border-zinc-800 bg-zinc-950 p-1.5">
                      {/* Paste-friendly URL/coords input */}
                      <Input
                        placeholder="Paste map link or coordinates (lat, lng)..."
                        value={locationInputs[well.name] ?? ''}
                        onChange={(e) => handleLocationInput(well.name, e.target.value)}
                        className="h-7 border-zinc-700 bg-zinc-800 text-[11px] text-zinc-200 placeholder:text-zinc-500"
                      />
                      {locationStatus[well.name] && (
                        <p className={`text-[10px] ${locationStatus[well.name].type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          {locationStatus[well.name].message}
                        </p>
                      )}
                      {wellLocations[well.name] && !locationStatus[well.name] && (
                        <p className="text-[10px] text-zinc-400">
                          Current: {wellLocations[well.name].string}
                        </p>
                      )}

                      {/* Collapsible manual lat/lng */}
                      <button
                        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                        onClick={() => setShowManualCoords((prev) => ({ ...prev, [well.name]: !prev[well.name] }))}
                      >
                        <ChevronDown className={`h-3 w-3 transition-transform ${showManualCoords[well.name] ? 'rotate-180' : ''}`} />
                        Manual entry
                      </button>
                      {showManualCoords[well.name] && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] text-zinc-500">Lat</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="0.000000"
                              value={wellLocations[well.name]?.lat ?? ''}
                              onChange={(e) =>
                                handleLocationChange(well.name, 'lat', e.target.value)
                              }
                              className="h-6 w-24 border-zinc-700 bg-zinc-800 px-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] text-zinc-500">Lng</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="0.000000"
                              value={wellLocations[well.name]?.lng ?? ''}
                              onChange={(e) =>
                                handleLocationChange(well.name, 'lng', e.target.value)
                              }
                              className="h-6 w-24 border-zinc-700 bg-zinc-800 px-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* GPS Map */}
        {(() => {
          const mapLocations = wells
            .filter((w) => wellLocations[w.name])
            .map((w) => ({ name: w.name, location: wellLocations[w.name] }));
          if (mapLocations.length === 0) return null;
          return <WellMapWrapper locations={mapLocations} />;
        })()}
      </CardContent>
    </Card>
  );
}
