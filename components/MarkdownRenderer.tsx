'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkGfm,
        [remarkMath, { singleDollarTextMath: true }], // Enable $...$ for inline math
      ]}
      rehypePlugins={[rehypeKatex]}
      className={cn(
        'prose prose-sm max-w-none',
        'prose-headings:font-serif prose-headings:text-foreground prose-headings:font-normal',
        'prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6',
        'prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5',
        'prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4',
        'prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-em:text-foreground prose-em:italic',
        'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm',
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto',
        'prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0 prose-pre:prose-code:text-foreground',
        'prose-blockquote:border-l-border prose-blockquote:text-muted-foreground prose-blockquote:not-italic',
        'prose-ul:text-foreground prose-ul:space-y-2',
        'prose-ol:text-foreground prose-ol:space-y-2',
        'prose-li:text-foreground',
        'prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:no-underline',
        'prose-table:border-border prose-th:border-border prose-td:border-border',
        'prose-th:text-foreground prose-td:text-foreground',
        'prose-img:border-border prose-img:rounded-lg prose-img:shadow-sm',
        'prose-hr:border-border',
        'dark:prose-invert',
        className
      )}
      components={{
        // Custom components for better styling
        h1: ({ children, ...props }) => (
          <h1 className="text-3xl font-serif text-foreground font-normal mb-4 mt-6" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => {
          // Extract anchor ID from heading text if present (e.g., "### Heading {#anchor-id}")
          const text = typeof children === 'string' ? children : children?.toString() || '';
          const match = text.match(/\{#([a-z0-9-]+)\}$/);
          const id = match ? match[1] : undefined;
          const cleanText = text.replace(/\{#([a-z0-9-]+)\}$/, '').trim();

          return (
            <h2
              id={id}
              className="text-2xl font-serif text-foreground font-normal mb-3 mt-5"
              {...props}
            >
              {cleanText || children}
            </h2>
          );
        },
        h3: ({ children, ...props }) => {
          // Extract anchor ID from heading text if present (e.g., "### Heading {#anchor-id}")
          const text = typeof children === 'string' ? children : children?.toString() || '';
          const match = text.match(/\{#([a-z0-9-]+)\}$/);
          const id = match ? match[1] : undefined;
          const cleanText = text.replace(/\{#([a-z0-9-]+)\}$/, '').trim();

          return (
            <h3
              id={id}
              className="text-2xl font-serif text-foreground font-normal mb-3 mt-5"
              {...props}
            >
              {cleanText || children}
            </h3>
          );
        },
        p: ({ children, ...props }) => (
          <p className="text-foreground leading-relaxed mb-4" {...props}>
            {children}
          </p>
        ),
        strong: ({ children, ...props }) => (
          <strong className="text-foreground font-semibold" {...props}>
            {children}
          </strong>
        ),
        em: ({ children, ...props }) => (
          <em className="text-foreground italic" {...props}>
            {children}
          </em>
        ),
        code: ({ inline, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className="text-foreground bg-muted px-1 py-0.5 rounded font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code className="text-foreground font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children, ...props }) => (
          <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto" {...props}>
            {children}
          </pre>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-border text-muted-foreground not-italic pl-4 border-l-2 my-4"
            {...props}
          >
            {children}
          </blockquote>
        ),
        ul: ({ children, ...props }) => (
          <ul className="text-foreground space-y-2 list-disc pl-6 my-4" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="text-foreground space-y-2 list-decimal pl-6 my-4" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li className="text-foreground" {...props}>
            {children}
          </li>
        ),
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-2 hover:no-underline"
            target={href?.startsWith('http') ? '_blank' : '_self'}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            {...props}
          >
            {children}
          </a>
        ),
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-border rounded-lg" {...props}>
              {children}
            </table>
          </div>
        ),
        th: ({ children, ...props }) => (
          <th
            className="border border-border bg-muted text-foreground px-4 py-2 text-left font-semibold"
            {...props}
          >
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="border border-border text-foreground px-4 py-2" {...props}>
            {children}
          </td>
        ),
        hr: ({ ...props }) => <hr className="border-border my-6" {...props} />,
        img: ({ src, alt, ...props }) => (
          <img
            src={src}
            alt={alt}
            className="border border-border rounded-lg shadow-sm max-w-full h-auto my-4"
            {...props}
          />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
