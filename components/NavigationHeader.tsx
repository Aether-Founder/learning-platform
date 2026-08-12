import DarkModeToggle from './DarkModeToggle';

interface NavigationHeaderProps {
  title: string;
  youtubeUrl?: string;
  substackUrl?: string;
}

export default function NavigationHeader({
  title,
  youtubeUrl,
  substackUrl,
}: NavigationHeaderProps) {
  return (
    <header className="w-full bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="mb-4 text-4xl font-bold text-foreground font-serif">{title}</h1>
            <p className="mb-8 text-lg text-muted-foreground font-serif">
              A technical breakdown of complex systems.
            </p>
            <div className="flex gap-4">
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-black dark:bg-[hsl(222.2,84%,95.1%)] px-6 py-3 text-sm font-medium text-white dark:text-[hsl(222.2,84%,4.9%)] hover:bg-gray-800 dark:hover:bg-[hsl(222.2,84%,90%)] transition-colors font-sans"
                >
                  Watch on YouTube
                </a>
              )}
              {substackUrl && (
                <a
                  href={substackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-gray-300 dark:border-gray-600 bg-background dark:bg-transparent px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-secondary dark:hover:bg-gray-800 transition-colors font-sans"
                >
                  Read on Substack
                </a>
              )}
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
