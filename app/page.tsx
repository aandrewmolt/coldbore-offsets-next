'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Camera, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-12 text-center">
        <h1 className="sr-only">ShearFRAC - Field Photo Organizer</h1>
        <Image
          src="/shearfrac-logo.webp"
          alt="ShearFRAC"
          width={280}
          height={64}
          className="mx-auto h-14 w-auto"
          priority
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Field Photo Organizer
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        <Link href="/offsets" className="group">
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="rounded-xl bg-blue-500/10 p-4">
                <Camera className="h-10 w-10 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Offset Photos</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Casing &amp; tubing pressure photos, well overviews, signage
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rigup" className="group">
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="rounded-xl bg-orange-500/10 p-4">
                <Wrench className="h-10 w-10 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Rig Up Photos</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Equipment setup, pad overview, wellside, pumps
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
