'use client';

import { CategoryProvider } from '@/lib/category-context';
import { RIGUP_CATEGORIES } from '@/lib/config';
import { RIGUP_CATEGORY_ABBREV } from '@/lib/naming';

export default function RigUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategoryProvider
      categories={RIGUP_CATEGORIES}
      categoryAbbrev={RIGUP_CATEGORY_ABBREV}
      storagePrefix="rigup"
      mode="rigup"
    >
      {children}
    </CategoryProvider>
  );
}
