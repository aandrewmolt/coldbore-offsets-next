'use client';

import { CategoryProvider } from '@/lib/category-context';
import { CONFIG } from '@/lib/config';
import { CATEGORY_ABBREV } from '@/lib/naming';

export default function OffsetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategoryProvider
      categories={[...CONFIG.PHOTO_CATEGORIES]}
      categoryAbbrev={CATEGORY_ABBREV}
      storagePrefix="offsets"
      mode="offsets"
    >
      {children}
    </CategoryProvider>
  );
}
