# ShearFRAC Round 3 — Ralph Loop Test Prompt

## Project: `/home/molt/projects/shearfrac-photos/`

## Overview
Implement 6 improvements in priority order. Each iteration should pick up the next unfinished improvement, implement it, and verify it passes `npx tsc --noEmit && npm run build && npx playwright test`.

Check what's already done before starting — read the files to see if the improvement is already implemented.

---

## Improvement 1: Fix Save/Restore Data Integrity (IndexedDB for images)

**Problem:** `lib/storage.ts` `compressPhotosForStorage()` strips `dataUrl` and `jpegUrl` before saving to localStorage. When the session is restored, photos have no image data — broken images.

**Solution:**
- **NEW** `lib/indexed-db.ts` — IndexedDB wrapper for storing photo binary data (dataUrl + jpegUrl) keyed by photo ID. Functions: `savePhotoBinaries(photos)`, `loadPhotoBinaries(photoIds)`, `deletePhotoBinaries(photoIds)`, `clearAllPhotoBinaries()`. Use database name `shearfrac-photos`, object store `photo-binaries`.
- **MOD** `lib/storage.ts`:
  - `saveToLocalStorage()` — After saving metadata to localStorage, also call `savePhotoBinaries()` to persist image data to IndexedDB
  - `loadFromLocalStorage()` — After loading metadata, call `loadPhotoBinaries()` to reattach `dataUrl` and `jpegUrl` to each photo. Make this function async.
- **MOD** `hooks/use-auto-save.ts` — Update to handle async save
- **MOD** `app/page.tsx` — Update restore logic to handle async `loadFromLocalStorage()`
- **MOD** `lib/storage.ts` `clearAllStorage()` — Also call `clearAllPhotoBinaries()`
- **MOD** `lib/storage.ts` `saveProject()` / `loadProjectById()` — Also persist/restore binaries via IndexedDB

**Verification:**
- Upload a photo, reload page, verify the restored photo still has its image visible
- E2E test: upload photo, save, reload, check image src is not empty

---

## Improvement 2: Make Autosave Truthful and Less Noisy

**Problem:** `markSaved()` is called without checking if `saveToLocalStorage()` actually succeeded. Repeated "Auto-saved" toasts are noisy.

**Solution:**
- **MOD** `hooks/use-auto-save.ts` — Check return value of save before calling `markSaved()`. On failure, show `toast.error('Auto-save failed')` once (don't spam). Replace repeated success toasts with nothing (silent success). Only show a toast on the FIRST successful save of a session, or after a failure recovery.
- **MOD** `components/header.tsx` or create **NEW** `components/save-status.tsx` — Add a subtle save status indicator in the header: "Saved 2m ago" / "Unsaved changes" / "Save failed". Use relative time (update every 30s).
- Remove all `toast.success('Auto-saved...')` calls from auto-save hook.

**Verification:**
- Auto-save runs without toast spam
- Header shows save status indicator
- E2E test: verify save status element exists in header

---

## Improvement 3: Pre-Export Validation Center

**Problem:** Users can export PPTX/ZIP with missing data (no wells assigned, no categories, no tech name). They only discover issues after export.

**Solution:**
- **NEW** `components/modals/export-validation-modal.tsx` — Modal showing checklist before export:
  - Photos without well assignment (count + list)
  - Photos without category (count + list)
  - Tech name missing (for PPTX)
  - Duplicate photo names
  - Long-lag photos (warning, not blocking)
  - Each issue row is clickable to jump to/highlight the affected photos
  - "Export Anyway" button + "Fix Issues" button
- **MOD** `components/export-section.tsx` — When user clicks PPTX or ZIP export, first run validation. If issues found, show validation modal instead of immediately exporting. If no issues, export directly.
- **NEW** `lib/export-validation.ts` — Pure function `validateExport(photos, wells, techName)` returning `{ issues: ExportIssue[] }` where each issue has `type`, `severity` ('error' | 'warning'), `message`, `affectedPhotoIds`.

**Verification:**
- Upload photos without wells/categories, click export, see validation modal
- E2E test: verify validation modal appears when exporting with unassigned photos

---

## Improvement 4: Tighten E2E Signal Quality

**Problem:** Many existing tests just take screenshots without meaningful assertions. Some tests don't verify the actual behavior.

**Solution:**
- **MOD** `e2e/shearfrac.spec.ts` — Strengthen existing tests:
  - Test 4 (photo upload): Assert photo card is actually rendered in DOM after upload
  - Test 5 (photo card controls): Assert well/category select dropdowns exist
  - Test 10 (persistence): Actually verify data round-trips through localStorage (or IndexedDB after improvement 1)
  - Test for restore correctness: upload photo, reload, verify photo card re-appears with image
  - Test for export validation: click export with unassigned photos, verify validation modal
  - Test for save status indicator in header
- Add proper `await expect()` assertions instead of just screenshots

**Verification:**
- All tests pass with real assertions
- `npx playwright test` — all pass

---

## Improvement 5: Web Worker for Batch Uploads

**Problem:** EXIF extraction + image compression runs on the main thread. With 50+ images this freezes the UI.

**Solution:**
- **NEW** `workers/image-processor.worker.ts` — Web Worker that handles:
  - EXIF extraction (port the logic from `lib/exif.ts`)
  - Image compression/WebP conversion (port from `lib/image-processor.ts`)
  - Receives File data via postMessage, returns processed photo data
  - Note: Web Workers can't access DOM canvas directly. Use OffscreenCanvas (modern browsers) with a fallback to main-thread processing for unsupported browsers.
- **NEW** `lib/worker-pool.ts` — Pool of N workers (default: `navigator.hardwareConcurrency || 4`). Queue files, dispatch to available workers, collect results.
- **MOD** `hooks/use-photo-upload.ts` — Use worker pool for processing. Add cancel support: `abortController` ref, "Cancel" button during upload. Add pause/resume toggle.
- **MOD** `components/upload-zone.tsx` or `components/photo-grid.tsx` — Show cancel button during upload processing.
- **FALLBACK** — If OffscreenCanvas is not available (e.g., Firefox < 105), fall back to current main-thread processing gracefully.

**Verification:**
- Upload 10+ images, UI remains responsive during processing
- Cancel button works mid-upload
- E2E test: upload multiple images, verify they all process successfully

---

## Improvement 6: Bulk Edit UX Improvements

**Problem:** Assigning wells/categories to many photos one-by-one is tedious. No way to filter to just unassigned photos quickly.

**Solution:**
- **NEW** `components/filter-presets.tsx` — Quick filter buttons above the photo grid:
  - "All" / "Unassigned" / "No Well" / "No Category" / "Flagged (Lag)"
  - Clicking a preset sets the appropriate filters in the store
- **MOD** `components/photo-sidebar.tsx` — Add "Unassigned" quick filter option in well dropdown and category dropdown
- **MOD** `components/photo-grid.tsx` — Add filter presets bar above the grid
- **MOD** `components/batch-toolbar.tsx` — Add "Select All Visible" button to quickly select all photos matching current filter
- **MOD** `lib/store.ts` — Add `selectAllFiltered(filteredPhotoIds: string[])` action

**Verification:**
- "Unassigned" quick filter shows only photos without well/category
- "Select All Visible" selects all filtered photos
- E2E test: upload photos, use "Unassigned" filter, verify only unassigned shown

---

## Execution Order
1. Improvement 1 (IndexedDB) — foundational, fixes broken restore
2. Improvement 2 (Autosave) — depends on 1's async save
3. Improvement 3 (Export validation) — standalone
4. Improvement 4 (E2E quality) — tests everything above
5. Improvement 5 (Web Workers) — performance, can verify with tests
6. Improvement 6 (Bulk edit UX) — UX polish, add tests

## After Each Improvement
Run: `npx tsc --noEmit && npm run build && npx playwright test`
Fix any failures before moving to the next improvement.

## Completion Criteria
All 6 improvements implemented, `npx tsc --noEmit` clean, `npm run build` succeeds, `npx playwright test` all pass.
