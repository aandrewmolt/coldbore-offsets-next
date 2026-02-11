// PowerPoint Export Module - Generates professional PPTX presentations
// Uses pptxgenjs for slide generation with ShearFRAC branding

import { Photo, Well, GPSLocation } from './types';
import { CONFIG } from './config';
import { formatFileSize } from './utils';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface AppStoreState {
  photos: Photo[];
  wells: Well[];
  wellLocations: Record<string, GPSLocation>;
  projectInfo: {
    clientName: string;
    jobName: string;
    jobDateTime: Date | null;
    projectNotes: string;
  };
  techName: string;
  totalOriginalSize: number;
  totalOptimizedSize: number;
}

// --------------------------------------------------------------------------
// Color scheme
// --------------------------------------------------------------------------

const COLORS = {
  CHARCOAL: '2C3E50',
  DARK_BG: '0A0A0A',
  DARK_SUMMARY: '1A1A1A',
  DARK_GRAY: '242424',
  GOLD: 'D4A017',
  DARK_GOLD: 'B8860B',
  LIGHT_GOLD: 'F5E6B8',
  WHITE: 'FFFFFF',
  LIGHT_GRAY: 'F8F8F8',
  MED_GRAY: '7F8C8D',
  DARK_BLUE: '34495E',
  RED: 'E74C3C',
  GREEN: '4CAF50',
  BLUE: '3498DB',
} as const;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    casing_fullview: COLORS.BLUE,
    casing_pressure: COLORS.RED,
    casing_reference: COLORS.GOLD,
    tubing_fullview: COLORS.BLUE,
    tubing_pressure: COLORS.RED,
    tubing_reference: COLORS.GOLD,
    overview: COLORS.GREEN,
    signage: COLORS.MED_GRAY,
    equipment: COLORS.DARK_BLUE,
  };
  return map[category] || COLORS.RED;
}

function getCategoryLabel(category: string): string {
  const def = CONFIG.PHOTO_CATEGORIES.find((c) => c.value === category);
  return def ? def.label : (category || 'Unassigned');
}

interface WellPhotoGroup {
  well: Well;
  photos: Photo[];
  categories: string[];
}

function groupPhotosByWell(photos: Photo[], wells: Well[]): WellPhotoGroup[] {
  const groups: WellPhotoGroup[] = [];
  for (const well of wells) {
    const wellPhotos = photos.filter((p) => p.well === well.name);
    if (wellPhotos.length > 0) {
      groups.push({
        well,
        photos: wellPhotos,
        categories: [...new Set(wellPhotos.map((p) => p.category).filter(Boolean))],
      });
    }
  }
  return groups;
}

function formatSlideDate(date: Date | string | null): string {
  if (!date) return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase();
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase();
}

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_');
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.substring(0, max - 3) + '...';
}

/**
 * Compute fitted image dimensions that maintain aspect ratio within a box.
 */
function fitImage(
  meta: { width: number; height: number } | null | undefined,
  boxW: number,
  boxH: number,
): { w: number; h: number } {
  if (!meta || !meta.width || !meta.height) return { w: boxW, h: boxH };
  const aspect = meta.width / meta.height;
  let w = boxW;
  let h = boxH;
  if (aspect > boxW / boxH) {
    h = boxW / aspect;
  } else {
    w = boxH * aspect;
  }
  return { w, h };
}

// --------------------------------------------------------------------------
// Slide builders
// --------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pptx = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Slide = any;

function addTitleSlide(pptx: Pptx, state: AppStoreState): void {
  const { projectInfo, techName, photos } = state;
  const client = projectInfo.clientName || 'Client';
  const job = projectInfo.jobName || 'Job';

  const slide: Slide = pptx.addSlide();
  slide.background = { color: COLORS.DARK_BG };

  // Decorative gold bars
  slide.addShape('rect', { x: 0, y: 0.5, w: 10, h: 0.05, fill: { color: COLORS.GOLD } });
  slide.addShape('rect', { x: 0, y: 5.2, w: 10, h: 0.05, fill: { color: COLORS.GOLD } });

  // Main title
  slide.addText('OFFSET PHOTO', {
    x: 0.5, y: 1.2, w: 9, h: 0.8,
    fontSize: 44, bold: true, color: COLORS.GOLD,
    align: 'center', fontFace: 'Arial Black',
    shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45 },
  });
  slide.addText('DOCUMENTATION', {
    x: 0.5, y: 2.1, w: 9, h: 0.6,
    fontSize: 38, bold: true, color: COLORS.WHITE,
    align: 'center', fontFace: 'Arial',
    shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45 },
  });

  // Client info box - positioned between the two gold lines (y=0.5 and y=5.2)
  slide.addShape('rect', {
    x: 2, y: 2.9, w: 6, h: 2.0,
    fill: { color: COLORS.CHARCOAL, transparency: 20 },
    line: { color: COLORS.GOLD, width: 2 },
  });

  slide.addText(truncate(client.toUpperCase(), 25), {
    x: 2, y: 3.0, w: 6, h: 0.4,
    fontSize: 20, bold: true, color: COLORS.WHITE, align: 'center', shrinkText: true,
  });

  slide.addText(truncate(job.toUpperCase(), 30), {
    x: 2, y: 3.4, w: 6, h: 0.35,
    fontSize: 17, color: COLORS.GOLD, align: 'center', shrinkText: true,
  });

  slide.addText(formatSlideDate(projectInfo.jobDateTime), {
    x: 2, y: 3.8, w: 6, h: 0.3,
    fontSize: 13, color: COLORS.MED_GRAY, align: 'center', shrinkText: true,
  });

  if (techName) {
    slide.addText(`RIGGED UP BY: ${techName.toUpperCase()}`, {
      x: 2, y: 4.2, w: 6, h: 0.4,
      fontSize: 14, bold: true, color: COLORS.GOLD, align: 'center', shrinkText: true,
    });
  }

  // Branding
  slide.addText('ShearFRAC', {
    x: 0.5, y: 5.05, w: 9, h: 0.25,
    fontSize: 12, color: COLORS.GOLD, align: 'center', italic: true,
  });

  slide.addText(`${photos.length} Photos Documented`, {
    x: 0.5, y: 5.32, w: 4, h: 0.2,
    fontSize: 8, color: COLORS.MED_GRAY, align: 'left',
  });

  slide.addText('CONFIDENTIAL - PROPRIETARY INFORMATION', {
    x: 4.5, y: 5.32, w: 5, h: 0.2,
    fontSize: 8, color: COLORS.MED_GRAY, align: 'right',
  });
}

interface TocEntry {
  name: string;
  count: number;
  startSlide: number;
  categories: string[];
  categorySlides: Record<string, number>;
  hasLocation: boolean;
}

function addTableOfContents(
  pptx: Pptx,
  wellGroups: WellPhotoGroup[],
  wellLocations: Record<string, GPSLocation>,
  totalTocSlides: number,
): TocEntry[] {
  const tocEntries: TocEntry[] = [];
  const photosPerSlide = 2;

  // Calculate starting slide number: 1 (title) + totalTocSlides + 1 (summary)
  let currentSlideNum = 1 + totalTocSlides + 1;

  for (const group of wellGroups) {
    const sortedPhotos = [...group.photos].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      const catA = a.category || 'uncategorized';
      const catB = b.category || 'uncategorized';
      return catA.localeCompare(catB);
    });

    // Determine which photos go to OPS slides vs regular
    const opsIds = new Set<string>();
    const casingPressure = sortedPhotos.find((p) => p.category === 'casing_pressure');
    const casingReference = sortedPhotos.find((p) => p.category === 'casing_reference');
    const tubingPressure = sortedPhotos.find((p) => p.category === 'tubing_pressure');
    const tubingReference = sortedPhotos.find((p) => p.category === 'tubing_reference');
    if (casingPressure) opsIds.add(casingPressure.id);
    if (casingReference) opsIds.add(casingReference.id);
    if (tubingPressure) opsIds.add(tubingPressure.id);
    if (tubingReference) opsIds.add(tubingReference.id);

    const regularPhotos = sortedPhotos.filter((p) => !opsIds.has(p.id));
    const regularSlides = Math.ceil(regularPhotos.length / photosPerSlide);
    const hasCasingOps = !!(casingPressure || casingReference);
    const hasTubingOps = !!(tubingPressure || tubingReference);
    const opsSlideCount = (hasCasingOps ? 1 : 0) + (hasTubingOps ? 1 : 0);

    // Category slide mapping
    const categorySlides: Record<string, number> = {};
    for (const cat of group.categories) {
      for (let pi = 0; pi < regularPhotos.length; pi++) {
        if (regularPhotos[pi].category === cat) {
          categorySlides[cat] = currentSlideNum + Math.floor(pi / photosPerSlide);
          break;
        }
      }
    }

    tocEntries.push({
      name: group.well.name,
      count: group.photos.length,
      startSlide: currentSlideNum,
      categories: group.categories,
      categorySlides,
      hasLocation: !!wellLocations[group.well.name],
    });

    currentSlideNum += regularSlides + opsSlideCount;
  }

  // Now render TOC slides
  const maxPerPage = 5;
  let tocSlide: Slide | null = null;
  let tocY = 0;

  for (let i = 0; i < tocEntries.length; i++) {
    const entry = tocEntries[i];

    // Start new TOC slide when needed
    if (i % maxPerPage === 0) {
      tocSlide = pptx.addSlide();
      tocSlide.background = { color: COLORS.LIGHT_GRAY };

      const isFirst = i === 0;
      const headerH = isFirst ? 1.2 : 0.8;

      tocSlide.addShape('rect', { x: 0, y: 0, w: 10, h: headerH, fill: { color: COLORS.CHARCOAL } });

      tocSlide.addText(isFirst ? 'TABLE OF CONTENTS' : 'TABLE OF CONTENTS (Continued)', {
        x: 0.5, y: isFirst ? 0.35 : 0.2, w: 9, h: isFirst ? 0.5 : 0.4,
        fontSize: isFirst ? 32 : 24, bold: true, color: COLORS.WHITE, align: 'center',
        fontFace: 'Arial Black',
      });

      if (isFirst) {
        tocSlide.addShape('rect', { x: 3.5, y: 0.9, w: 3, h: 0.03, fill: { color: COLORS.GOLD } });
      }

      tocY = isFirst ? 1.5 : 1.2;
    }

    // Entry box
    tocSlide!.addShape('rect', {
      x: 0.5, y: tocY - 0.2, w: 9, h: 0.8,
      fill: { color: i % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY },
      line: { color: COLORS.MED_GRAY, width: 0.5 },
    });

    // Number badge
    tocSlide!.addShape('rect', {
      x: 0.8, y: tocY - 0.1, w: 0.5, h: 0.3,
      fill: { color: COLORS.GOLD },
      line: { color: COLORS.DARK_GOLD, width: 1 },
    });
    tocSlide!.addText(String(i + 1), {
      x: 0.8, y: tocY - 0.1, w: 0.5, h: 0.3,
      fontSize: 12, bold: true, color: COLORS.WHITE, align: 'center', valign: 'middle',
    });

    // Well name hyperlink
    tocSlide!.addText(truncate(entry.name, 25), {
      x: 1.5, y: tocY - 0.05, w: 4, h: 0.3,
      fontSize: 14, bold: true, color: COLORS.BLUE,
      underline: { style: 'single', color: COLORS.BLUE },
      hyperlink: { slide: entry.startSlide, tooltip: `Go to ${entry.name} photos` },
    });

    // Photo count badge
    tocSlide!.addShape('rect', {
      x: 6, y: tocY - 0.08, w: 1.2, h: 0.25,
      fill: { color: COLORS.MED_GRAY },
      line: { color: COLORS.DARK_BLUE, width: 0.5 },
    });
    tocSlide!.addText(`${entry.count} photos`, {
      x: 6, y: tocY - 0.08, w: 1.2, h: 0.25,
      fontSize: 10, bold: true, color: COLORS.WHITE, align: 'center', valign: 'middle',
    });

    // Category links
    if (entry.categories.length > 0) {
      let catX = 1.5;
      tocSlide!.addText('Categories: ', {
        x: catX, y: tocY + 0.25, w: 1, h: 0.2,
        fontSize: 9, color: COLORS.MED_GRAY, italic: true,
      });
      catX += 1;

      const displayCats = entry.categories.slice(0, 3);
      displayCats.forEach((cat, catIdx) => {
        const slideNum = entry.categorySlides[cat] || entry.startSlide;
        tocSlide!.addText(getCategoryLabel(cat), {
          x: catX, y: tocY + 0.25, w: 1.2, h: 0.2,
          fontSize: 9, color: COLORS.BLUE,
          underline: { style: 'single', color: COLORS.BLUE },
          hyperlink: { slide: slideNum, tooltip: `Go to ${cat} photos for ${entry.name}` },
        });
        catX += 1.2;
        if (catIdx < displayCats.length - 1) {
          tocSlide!.addText(' \u2022 ', {
            x: catX, y: tocY + 0.25, w: 0.2, h: 0.2,
            fontSize: 9, color: COLORS.MED_GRAY,
          });
          catX += 0.2;
        }
      });

      if (entry.categories.length > 3) {
        tocSlide!.addText(' ...', {
          x: catX, y: tocY + 0.25, w: 0.3, h: 0.2,
          fontSize: 9, color: COLORS.MED_GRAY, italic: true,
        });
      }
    } else {
      tocSlide!.addText('Categories: Uncategorized', {
        x: 1.5, y: tocY + 0.25, w: 5, h: 0.2,
        fontSize: 9, color: COLORS.MED_GRAY, italic: true,
      });
    }

    // GPS indicator
    let indX = 7.5;
    if (entry.hasLocation) {
      tocSlide!.addText('[GPS]', {
        x: indX, y: tocY - 0.05, w: 0.5, h: 0.3,
        fontSize: 12, color: COLORS.GREEN,
      });
      indX += 0.5;
    }

    // Slide reference
    tocSlide!.addText(`\u2192 Slide ${entry.startSlide}`, {
      x: indX, y: tocY - 0.05, w: 1.5, h: 0.3,
      fontSize: 11, bold: true, color: COLORS.CHARCOAL,
      hyperlink: { slide: entry.startSlide, tooltip: `Go to slide ${entry.startSlide}` },
    });

    tocY += 1.0;
  }

  // Summary footer on last TOC slide if space
  if (tocSlide && tocY < 4.5) {
    const totalPhotos = tocEntries.reduce((s, e) => s + e.count, 0);
    const percentage = totalPhotos > 0
      ? Math.round((tocEntries.reduce((s, e) => s + e.count, 0) / totalPhotos) * 100)
      : 0;

    tocSlide.addShape('rect', {
      x: 2, y: 4.6, w: 6, h: 0.7,
      fill: { color: COLORS.CHARCOAL },
      line: { color: COLORS.GOLD, width: 2 },
    });
    tocSlide.addText(
      `${tocEntries.length} WELLS | ${totalPhotos} PHOTOS`,
      {
        x: 2, y: 4.75, w: 6, h: 0.4,
        fontSize: 12, bold: true, color: COLORS.WHITE, align: 'center',
      },
    );
  }

  return tocEntries;
}

function addSummarySlide(pptx: Pptx, state: AppStoreState): void {
  const { photos, wells, projectInfo, totalOriginalSize, totalOptimizedSize } = state;
  const notes = projectInfo.projectNotes || '';
  const organizedCount = photos.filter((p) => p.well && p.category).length;
  const gpsCount = photos.filter((p) => p.metadata?.location || p.manualLocation).length;

  const slide: Slide = pptx.addSlide();
  slide.background = { color: COLORS.DARK_SUMMARY };

  // TOC back link
  slide.addText('\u2190 Back to Table of Contents', {
    x: 0.2, y: 5.2, w: 3, h: 0.25,
    fontSize: 10, color: COLORS.GOLD, align: 'left', bold: true,
    underline: true,
    hyperlink: { slide: 2, tooltip: 'Go back to Table of Contents' },
  });

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 1.5, fill: { color: COLORS.CHARCOAL, transparency: 20 } });

  slide.addText('PROJECT OVERVIEW', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 36, bold: true, color: COLORS.WHITE, align: 'center',
    fontFace: 'Arial Black',
    shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45 },
  });

  slide.addText('PERFORMANCE METRICS & STATISTICS', {
    x: 0.5, y: 0.9, w: 9, h: 0.3,
    fontSize: 14, color: COLORS.GOLD, align: 'center',
  });

  // Stats boxes
  const pct = photos.length > 0 ? Math.round((organizedCount / photos.length) * 100) : 0;
  const spaceSaved = formatFileSize(totalOriginalSize - totalOptimizedSize);

  const stats = [
    { label: 'TOTAL WELLS', value: String(wells.length), icon: 'Wells', color: COLORS.BLUE },
    { label: 'TOTAL PHOTOS', value: String(photos.length), icon: 'Photos', color: COLORS.GOLD },
    { label: 'ORGANIZED', value: `${pct}%`, icon: 'Done', color: COLORS.GREEN },
    { label: 'WITH GPS', value: String(gpsCount), icon: 'GPS', color: COLORS.RED },
  ];

  stats.forEach((stat, idx) => {
    const x = 1 + idx * 2.2;
    slide.addShape('rect', {
      x, y: 2, w: 2, h: 1.5,
      fill: { color: COLORS.WHITE, transparency: 10 },
      line: { color: stat.color, width: 2 },
    });
    slide.addText(stat.icon, { x, y: 2.1, w: 2, h: 0.4, fontSize: 24, align: 'center' });
    slide.addText(stat.value, {
      x, y: 2.5, w: 2, h: 0.5,
      fontSize: 28, bold: true, color: COLORS.WHITE, align: 'center',
    });
    slide.addText(stat.label, {
      x, y: 3, w: 2, h: 0.3,
      fontSize: 10, color: COLORS.GOLD, align: 'center',
    });
  });

  // Space saved note
  if (totalOriginalSize > 0) {
    slide.addText(`Space saved: ${spaceSaved}`, {
      x: 1, y: 3.6, w: 8, h: 0.3,
      fontSize: 11, color: COLORS.MED_GRAY, align: 'center', italic: true,
    });
  }

  // Project notes
  if (notes) {
    slide.addShape('rect', {
      x: 1, y: 4, w: 8, h: 1.5,
      fill: { color: COLORS.CHARCOAL, transparency: 30 },
      line: { color: COLORS.GOLD, width: 1 },
    });
    slide.addText('PROJECT NOTES', {
      x: 1, y: 4.1, w: 8, h: 0.3,
      fontSize: 12, bold: true, color: COLORS.GOLD, align: 'center',
    });
    slide.addText(truncate(notes, 200), {
      x: 1.3, y: 4.5, w: 7.4, h: 0.9,
      fontSize: 10, color: COLORS.WHITE, align: 'left', shrinkText: true, wrap: true,
    });
  }
}

function addPhotoSlides(
  pptx: Pptx,
  wellGroups: WellPhotoGroup[],
  wellLocations: Record<string, GPSLocation>,
): void {
  for (const group of wellGroups) {
    const sortedPhotos = [...group.photos].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      const catA = a.category || 'uncategorized';
      const catB = b.category || 'uncategorized';
      return catA.localeCompare(catB);
    });

    // Determine OPS photos
    const casingPressure = sortedPhotos.find((p) => p.category === 'casing_pressure');
    const casingReference = sortedPhotos.find((p) => p.category === 'casing_reference');
    const tubingPressure = sortedPhotos.find((p) => p.category === 'tubing_pressure');
    const tubingReference = sortedPhotos.find((p) => p.category === 'tubing_reference');

    const opsIds = new Set<string>();
    if (casingPressure) opsIds.add(casingPressure.id);
    if (casingReference) opsIds.add(casingReference.id);
    if (tubingPressure) opsIds.add(tubingPressure.id);
    if (tubingReference) opsIds.add(tubingReference.id);

    const regularPhotos = sortedPhotos.filter((p) => !opsIds.has(p.id));

    // Regular photo slides - 2 per slide
    for (let i = 0; i < regularPhotos.length; i += 2) {
      const slide: Slide = pptx.addSlide();
      slide.background = { color: COLORS.WHITE };

      // Header bar
      slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.8, fill: { color: COLORS.CHARCOAL } });
      slide.addShape('rect', { x: 0, y: 0.8, w: 10, h: 0.03, fill: { color: COLORS.GOLD } });

      // Well name badge
      slide.addShape('rect', {
        x: 0.3, y: 0.15, w: 3, h: 0.5,
        fill: { color: COLORS.GOLD, transparency: 20 },
        line: { color: COLORS.GOLD, width: 1 },
      });
      slide.addText(group.well.name.toUpperCase(), {
        x: 0.3, y: 0.25, w: 3, h: 0.3,
        fontSize: 16, bold: true, color: COLORS.WHITE,
      });

      // Page indicator
      const pageNum = Math.floor(i / 2) + 1;
      const totalPages = Math.ceil(regularPhotos.length / 2);
      slide.addText(`Page ${pageNum} of ${totalPages}`, {
        x: 7, y: 0.3, w: 2.5, h: 0.3,
        fontSize: 11, color: COLORS.GOLD, align: 'right',
      });

      // Render up to 2 photos
      const batch = regularPhotos.slice(i, Math.min(i + 2, regularPhotos.length));
      batch.forEach((photo, idx) => {
        const xBase = idx === 0 ? 0.3 : 5.2;
        addPhotoToSlide(slide, photo, xBase, i + idx + 1, wellLocations);
      });

      // Footer
      slide.addShape('rect', { x: 0, y: 5.2, w: 10, h: 0.4, fill: { color: COLORS.LIGHT_GRAY } });
      slide.addText('Back to Table of Contents', {
        x: 0.2, y: 5.25, w: 3.5, h: 0.3,
        fontSize: 11, color: COLORS.GOLD, align: 'left', bold: true,
        underline: true,
        hyperlink: { slide: 2, tooltip: 'Go back to Table of Contents' },
      });
      slide.addText('QUALITY - PRECISION - EXCELLENCE', {
        x: 6.2, y: 5.25, w: 3.6, h: 0.3,
        fontSize: 10, color: COLORS.MED_GRAY, align: 'right', italic: true,
      });
    }

    // OPS Slides - Casing
    if (casingPressure || casingReference) {
      addOpsSlide(pptx, group.well.name, 'CASING', casingPressure || null, casingReference || null);
    }

    // OPS Slides - Tubing
    if (tubingPressure || tubingReference) {
      addOpsSlide(pptx, group.well.name, 'TUBING', tubingPressure || null, tubingReference || null);
    }
  }
}

function addPhotoToSlide(
  slide: Slide,
  photo: Photo,
  xBase: number,
  photoNum: number,
  wellLocations: Record<string, GPSLocation>,
): void {
  // Photo container shadow
  slide.addShape('rect', {
    x: xBase - 0.05, y: 1.05, w: 4.1, h: 3.1,
    fill: { color: COLORS.LIGHT_GRAY },
    shadow: { type: 'outer', color: '000000', blur: 5, offset: 3, angle: 45, opacity: 0.3 },
  });

  try {
    const boxW = 4.0;
    const boxH = 3.0;
    const { w: imgW, h: imgH } = fitImage(photo.metadata, boxW, boxH);
    const imgX = xBase + (boxW - imgW) / 2;
    const imgY = 1.1 + (boxH - imgH) / 2;

    slide.addImage({
      data: photo.jpegUrl || photo.dataUrl,
      x: imgX, y: imgY, w: imgW, h: imgH,
      sizing: { type: 'contain', w: imgW, h: imgH },
    });

    const infoY = 4.3;

    // Category badge
    const catColor = photo.category ? getCategoryColor(photo.category) : COLORS.RED;
    slide.addShape('rect', {
      x: xBase, y: infoY, w: 1.8, h: 0.3,
      fill: { color: catColor }, line: { color: catColor },
    });
    slide.addText(getCategoryLabel(photo.category).toUpperCase(), {
      x: xBase, y: infoY + 0.05, w: 1.8, h: 0.2,
      fontSize: 9, bold: true, color: COLORS.WHITE, align: 'center',
    });

    // Photo number badge
    slide.addShape('rect', {
      x: xBase + 2, y: infoY, w: 1, h: 0.3,
      fill: { color: COLORS.CHARCOAL },
    });
    slide.addText(`#${photoNum}`, {
      x: xBase + 2, y: infoY + 0.05, w: 1, h: 0.2,
      fontSize: 9, bold: true, color: COLORS.WHITE, align: 'center',
    });

    // GPS indicator
    const loc = photo.metadata?.location || photo.manualLocation || wellLocations[photo.well];
    if (loc) {
      slide.addText('[GPS]', {
        x: xBase + 3.2, y: infoY, w: 0.5, h: 0.3,
        fontSize: 12, color: COLORS.GREEN, align: 'center',
      });
    }

    // Long-lag warning
    if (photo.hasLongLag) {
      slide.addShape('rect', {
        x: xBase + 3.7, y: infoY, w: 0.6, h: 0.3,
        fill: { color: COLORS.RED },
      });
      slide.addText('[!]', {
        x: xBase + 3.7, y: infoY + 0.05, w: 0.6, h: 0.2,
        fontSize: 10, bold: true, color: COLORS.WHITE, align: 'center',
      });
    }

    // Detail text
    const details: string[] = [];
    details.push(`File: ${truncate(photo.name, 30)}`);
    if (photo.captureDateTime) {
      details.push(`Date: ${new Date(photo.captureDateTime).toLocaleString()}`);
    }
    if (photo.metadata?.location) {
      details.push(`GPS: ${truncate(photo.metadata.location.string, 40)}`);
    }
    if (photo.notes) {
      details.push(`Notes: ${truncate(photo.notes, 50)}`);
    }

    slide.addText(details.slice(0, 4).join('\n'), {
      x: xBase, y: infoY + 0.4, w: 4.0, h: 0.8,
      fontSize: 8, color: COLORS.MED_GRAY, align: 'left', valign: 'top',
      shrinkText: true, wrap: true,
    });
  } catch (error) {
    console.error('Error adding image to PowerPoint:', error);
    slide.addText('Error loading image', {
      x: xBase, y: 2.5, w: 4.3, h: 0.5,
      fontSize: 12, align: 'center', color: COLORS.RED,
    });
  }
}

function addOpsSlide(
  pptx: Pptx,
  wellName: string,
  type: 'CASING' | 'TUBING',
  pressurePhoto: Photo | null,
  referencePhoto: Photo | null,
): void {
  const slide: Slide = pptx.addSlide();
  slide.background = { color: COLORS.LIGHT_GRAY };

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.8, fill: { color: COLORS.CHARCOAL } });
  slide.addShape('rect', { x: 0, y: 0.8, w: 10, h: 0.03, fill: { color: COLORS.GOLD } });

  // OPS badge
  slide.addShape('rect', {
    x: 0.3, y: 0.15, w: 1.5, h: 0.5,
    fill: { color: COLORS.RED }, line: { color: COLORS.RED, width: 1 },
  });
  slide.addText('OPS READY', {
    x: 0.3, y: 0.25, w: 1.5, h: 0.3,
    fontSize: 12, bold: true, color: COLORS.WHITE, align: 'center',
  });

  slide.addText(`${wellName.toUpperCase()} - ${type} PRESSURE COMPARISON`, {
    x: 2, y: 0.25, w: 6, h: 0.3,
    fontSize: 14, bold: true, color: COLORS.WHITE,
  });

  const imageY = 1.2;
  const imageH = 2.8;
  const imageW = 2.8;

  // Panel 1: Pressure
  addOpsPanel(slide, pressurePhoto, 0.3, imageY, imageW, imageH,
    `${type} PRESSURE`, COLORS.CHARCOAL, COLORS.WHITE,
    `NO ${type} PRESSURE\nPHOTO AVAILABLE`);

  // Panel 2: Reference
  addOpsPanel(slide, referencePhoto, 3.5, imageY, imageW, imageH,
    'REFERENCE GAUGE', COLORS.GOLD, COLORS.CHARCOAL,
    'NO REFERENCE GAUGE\nPHOTO AVAILABLE');

  // Panel 3: OPS screenshot placeholder
  slide.addShape('rect', {
    x: 6.7, y: imageY, w: imageW, h: imageH,
    fill: { color: 'F0F0F0' },
    line: { color: COLORS.BLUE, width: 3, dashType: 'dash' },
  });
  slide.addText('PASTE OPS\nSCREENSHOT\nHERE', {
    x: 6.7, y: imageY + imageH / 2 - 0.5, w: imageW, h: 1,
    fontSize: 14, color: COLORS.BLUE, align: 'center', bold: true,
  });
  slide.addShape('rect', {
    x: 6.7, y: imageY + imageH + 0.1, w: imageW, h: 0.4,
    fill: { color: COLORS.BLUE },
  });
  slide.addText('OPS SCREENSHOT', {
    x: 6.7, y: imageY + imageH + 0.15, w: imageW, h: 0.3,
    fontSize: 10, bold: true, color: COLORS.WHITE, align: 'center',
  });

  // Footer
  slide.addShape('rect', { x: 0, y: 5.3, w: 10, h: 0.325, fill: { color: COLORS.LIGHT_GRAY } });
  slide.addText('[Back to Table of Contents]', {
    x: 0.2, y: 5.4, w: 3, h: 0.2,
    fontSize: 9, color: COLORS.GOLD, align: 'left', bold: true,
    underline: true,
    hyperlink: { slide: 2, tooltip: 'Go back to Table of Contents' },
  });
  slide.addText('OPS: Paste screenshot in empty slot', {
    x: 6.5, y: 5.4, w: 3.3, h: 0.2,
    fontSize: 9, color: COLORS.RED, align: 'right', bold: true,
  });
}

function addOpsPanel(
  slide: Slide,
  photo: Photo | null,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  labelBg: string,
  labelColor: string,
  placeholder: string,
): void {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: COLORS.WHITE },
    line: { color: COLORS.CHARCOAL, width: 2 },
  });

  if (photo) {
    try {
      const { w: imgW, h: imgH } = fitImage(photo.metadata, w - 0.1, h - 0.1);
      slide.addImage({
        data: photo.jpegUrl || photo.dataUrl,
        x: x + (w - imgW) / 2,
        y: y + (h - imgH) / 2,
        w: imgW, h: imgH,
        sizing: { type: 'contain', w: imgW, h: imgH },
      });
    } catch (err) {
      console.error('Error adding OPS image:', err);
    }
  } else {
    slide.addText(placeholder, {
      x, y: y + h / 2 - 0.3, w, h: 0.6,
      fontSize: 12, color: COLORS.MED_GRAY, align: 'center', bold: true,
    });
  }

  // Label bar
  slide.addShape('rect', {
    x, y: y + h + 0.1, w, h: 0.4,
    fill: { color: labelBg },
  });
  slide.addText(label, {
    x, y: y + h + 0.15, w, h: 0.3,
    fontSize: 10, bold: true, color: labelColor, align: 'center',
  });
}

function addClosingSlide(pptx: Pptx, techName: string): void {
  const slide: Slide = pptx.addSlide();
  slide.background = { color: COLORS.DARK_BG };

  slide.addShape('rect', { x: 0, y: 2, w: 10, h: 0.05, fill: { color: COLORS.GOLD } });
  slide.addShape('rect', { x: 0, y: 5, w: 10, h: 0.05, fill: { color: COLORS.GOLD } });

  slide.addText('THANK YOU', {
    x: 0.5, y: 2.5, w: 9, h: 0.8,
    fontSize: 48, bold: true, color: COLORS.GOLD, align: 'center',
    fontFace: 'Arial Black',
    shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45 },
  });

  slide.addText('FOR YOUR BUSINESS', {
    x: 0.5, y: 3.3, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.WHITE, align: 'center',
  });

  if (techName) {
    slide.addText(`Rigged up by: ${techName}`, {
      x: 2, y: 3.9, w: 6, h: 0.3,
      fontSize: 14, color: COLORS.MED_GRAY, align: 'center', italic: true,
    });
  }

  slide.addShape('rect', {
    x: 2, y: 4.2, w: 6, h: 0.6,
    fill: { color: COLORS.CHARCOAL, transparency: 20 },
    line: { color: COLORS.GOLD, width: 1 },
  });

  slide.addText('ShearFRAC', {
    x: 2, y: 4.35, w: 6, h: 0.3,
    fontSize: 14, bold: true, color: COLORS.GOLD, align: 'center',
  });

  slide.addText(`Generated ${new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })}`, {
    x: 0.5, y: 5.1, w: 4.5, h: 0.3,
    fontSize: 10, color: COLORS.MED_GRAY, align: 'left',
  });

  slide.addText('QUALITY \u2022 PRECISION \u2022 EXCELLENCE', {
    x: 5, y: 5.1, w: 4.5, h: 0.3,
    fontSize: 12, color: COLORS.MED_GRAY, align: 'right', italic: true,
  });

  slide.addText('\u2190 Back to Table of Contents', {
    x: 0.2, y: 4.8, w: 3, h: 0.25,
    fontSize: 10, color: COLORS.GOLD, align: 'left', bold: true,
    underline: true,
    hyperlink: { slide: 2, tooltip: 'Go back to Table of Contents' },
  });
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Generate the PPTX as a Blob without triggering a download.
 * Shared by exportPowerPoint (download) and exportZip (embed in ZIP).
 */
export async function generatePptxBlob(state: AppStoreState): Promise<Blob> {
  const PptxGenJS = (await import('pptxgenjs')).default;

  const client = state.projectInfo.clientName || 'Client';
  const job = state.projectInfo.jobName || 'Job';

  const pptx = new PptxGenJS();
  pptx.author = 'ShearFRAC';
  pptx.company = client;
  pptx.subject = job;
  pptx.title = `${client} - ${job} Offset Photo Documentation`;

  const wellGroups = groupPhotosByWell(state.photos, state.wells);

  // Calculate how many TOC slides we need
  const maxPerPage = 5;
  const totalTocSlides = Math.max(1, Math.ceil(wellGroups.length / maxPerPage));

  // 1. Title slide
  addTitleSlide(pptx, state);

  // 2. Table of Contents (may be multiple slides)
  addTableOfContents(pptx, wellGroups, state.wellLocations, totalTocSlides);

  // 3. Summary dashboard
  addSummarySlide(pptx, state);

  // 4. Photo slides (regular + OPS)
  addPhotoSlides(pptx, wellGroups, state.wellLocations);

  // 5. Closing slide
  addClosingSlide(pptx, state.techName);

  // Generate blob
  const result = await pptx.write({ outputType: 'blob' });
  return result as Blob;
}

/**
 * Generate and download the PowerPoint presentation.
 */
export async function exportPowerPoint(state: AppStoreState): Promise<void> {
  const blob = await generatePptxBlob(state);

  const client = sanitizeFilename(state.projectInfo.clientName || 'Client');
  const job = sanitizeFilename(state.projectInfo.jobName || 'Job');
  const filename = `${client}_${job}_ShearFRAC_Report.pptx`;

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
