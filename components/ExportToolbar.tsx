interface ExportToolbarProps {
  onExportAnki: () => void;
  onExportFlashcards: () => void;
  onExportTranscript: () => void;
  onCopyTranscript: () => void;
}

export default function ExportToolbar({
  onExportAnki,
  onExportFlashcards,
  onExportTranscript,
  onCopyTranscript,
}: ExportToolbarProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
          Export
        </h3>
        <div className="flex flex-wrap gap-6">
          <button
            onClick={onExportAnki}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans"
          >
            Anki deck
          </button>
          <button
            onClick={onExportFlashcards}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans"
          >
            Flashcards
          </button>
          <button
            onClick={onExportTranscript}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans"
          >
            Transcript
          </button>
          <button
            onClick={onCopyTranscript}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans"
          >
            Copy transcript
          </button>
        </div>
      </div>
    </div>
  );
}
