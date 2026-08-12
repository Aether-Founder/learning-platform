'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function CopyContentPage({ params }: { params: { page: string } }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const { page } = params;

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/content/page/${page}/txt`);
      if (!response.ok) {
        throw new Error(t('copy_not_found'));
      }
      const text = await response.text();
      setContent(text);
      setLoading(false);
    } catch {
      setError(t('copy_error'));
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    loadContent();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('error_loading')}</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('copy_title')}</h1>
          <p className="text-muted-foreground">
            {t('copy_desc')}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t('copied')}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t('copy_to_clipboard')}
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('download')}
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap break-words">{content}</pre>
        </div>

        <div className="mt-6 bg-secondary/50 border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('copy_instructions_title')}</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>{t('copy_instruction_1')}</li>
            <li>{t('copy_instruction_2')}</li>
            <li>{t('copy_instruction_3')}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
