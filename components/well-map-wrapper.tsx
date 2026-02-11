'use client';

import dynamic from 'next/dynamic';
import { GPSLocation } from '@/lib/types';

const WellMap = dynamic(() => import('@/components/well-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full animate-pulse rounded-lg bg-zinc-800" />
  ),
});

interface WellMapWrapperProps {
  locations: Array<{ name: string; location: GPSLocation }>;
}

export function WellMapWrapper({ locations }: WellMapWrapperProps) {
  return <WellMap locations={locations} />;
}
