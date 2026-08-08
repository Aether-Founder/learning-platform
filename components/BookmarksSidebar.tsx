'use client';

import { memo } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Bookmark {
  paragraphId: string;
  title: string;
  timestamp: number;
}

interface BookmarksSidebarProps {
  bookmarks: Bookmark[];
  onRemove: (paragraphId: string) => void;
  onClear: () => void;
}

export const BookmarksSidebar = memo(function BookmarksSidebar({
  bookmarks,
  onRemove,
  onClear,
}: BookmarksSidebarProps) {
  const { t } = useTranslation();
  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          {t('bookmarks')} ({bookmarks.length})
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('clear_bookmarks')}
        </button>
      </div>
      <ul className="space-y-1">
        {bookmarks.map((bookmark) => (
          <li key={bookmark.paragraphId}>
            <div className="group flex items-start gap-2">
              <button
                onClick={() => {
                  const element = document.getElementById(bookmark.paragraphId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex-1 text-left px-3 py-2 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors line-clamp-2"
              >
                {bookmark.title || t('untitled')}
              </button>
              <button
                onClick={() => onRemove(bookmark.paragraphId)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                title={t('remove_bookmark')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
