"use client";

import { MarkdownRenderer } from "@/components/MarkdownRenderer";

function processNewlines(text: string) {
  return text.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\n/g, "  \n");
}

export function MarkdownContent({
  children,
  className = "text-base leading-relaxed text-foreground",
}: {
  children: string;
  className?: string;
}) {
  return (
    <MarkdownRenderer className={className}>{processNewlines(children)}</MarkdownRenderer>
  );
}
