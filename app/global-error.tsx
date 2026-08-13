'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-2xl font-bold">Er is een kritieke fout opgetreden</h2>
            <p className="text-muted-foreground">
              Er is een ernstige fout opgetreden. Probeer de pagina te vernieuwen.
            </p>
            <button
              onClick={reset}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Pagina vernieuwen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
