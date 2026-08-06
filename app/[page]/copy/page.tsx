"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

export default function CopyContentPage({ params }: { params: { page: string } }) {
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const { page } = params;

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/content/page/${page}/txt`);
      if (!response.ok) {
        throw new Error("Content not found");
      }
      const text = await response.text();
      setContent(text);
      setLoading(false);
    } catch (err) {
      setError("Failed to load content");
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    loadContent();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Copy Content for AI
          </h1>
          <p className="text-muted-foreground">
            Copy this content and paste it into ChatGPT or other AI tools.
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
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap break-words">
            {content}
          </pre>
        </div>

        <div className="mt-6 bg-secondary/50 border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Instructions:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Click "Copy to Clipboard" to copy the content</li>
            <li>Paste the content into ChatGPT or another AI tool</li>
            <li>Ask the AI to summarize, explain, or create practice questions</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
