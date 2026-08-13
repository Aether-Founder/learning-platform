'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold">Er is iets misgegaan</h2>
        <p className="text-muted-foreground">
          Er is een onverwachte fout opgetreden. Probeer het opnieuw.
        </p>
        <Button onClick={reset}>Opnieuw proberen</Button>
      </div>
    </div>
  );
}
