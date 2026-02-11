'use client';

import { Card, CardContent } from '@/components/ui/card';

export function PhotoCardSkeleton() {
  return (
    <Card className="relative overflow-hidden p-0">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <CardContent className="space-y-2.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="h-7 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
