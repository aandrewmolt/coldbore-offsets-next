'use client';

import { createContext, useContext, ReactNode } from 'react';
import { CategoryDefinition } from './types';

interface CategoryContextValue {
  categories: CategoryDefinition[];
  categoryAbbrev: Record<string, string>;
  storagePrefix: string;
  mode: 'offsets' | 'rigup';
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({
  children,
  categories,
  categoryAbbrev,
  storagePrefix,
  mode,
}: CategoryContextValue & { children: ReactNode }) {
  return (
    <CategoryContext.Provider value={{ categories, categoryAbbrev, storagePrefix, mode }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextValue {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return ctx;
}
