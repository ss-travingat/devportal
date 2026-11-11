'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import MermaidBlock from '@/components/MermaidBlock';

// rehype-raw lets authors embed arbitrary raw HTML/SVG in markdown source;
// without sanitizing afterwards that includes <script>, event-handler
// attributes, and SVG-borne script execution. The default (GitHub-style)
// schema already allows everything this viewer's `code` component needs
// (className, for syntax-highlighting/mermaid language detection).

function slugify(children: React.ReactNode): string {
  const text =
    typeof children === 'string'
      ? children
      : Array.isArray(children)
        ? (children as React.ReactNode[]).filter((c) => typeof c === 'string').join('')
        : '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Code block — route mermaid to MermaidBlock
          code({ className, children }) {
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            const codeStr = String(children).replace(/\n$/, '');
            const isBlock = codeStr.includes('\n') || Boolean(lang);

            if (lang === 'mermaid') {
              return <MermaidBlock code={codeStr} />;
            }

            if (isBlock) {
              return (
                <pre className="my-4 rounded-lg bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto">
                  <code className={`text-sm text-zinc-200 font-mono ${className ?? ''}`}>
                    {codeStr}
                  </code>
                </pre>
              );
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 text-[0.85em] font-mono">
                {codeStr}
              </code>
            );
          },

          // Headings — IDs enable TOC anchor links
          h1: ({ children }) => (
            <h1 id={slugify(children)} className="text-2xl font-bold text-white mt-8 mb-4 pb-3 border-b border-zinc-800 scroll-mt-6">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 id={slugify(children)} className="text-xl font-semibold text-white mt-7 mb-3 pb-2 border-b border-zinc-800/60 scroll-mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={slugify(children)} className="text-base font-semibold text-zinc-100 mt-6 mb-2 scroll-mt-6">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 id={slugify(children)} className="text-sm font-semibold text-zinc-200 mt-5 mb-2 scroll-mt-6">
              {children}
            </h4>
          ),

          // Paragraph
          p: ({ children }) => (
            <p className="text-sm text-zinc-300 leading-7 mb-4">{children}</p>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-2 border-zinc-600 text-zinc-400 italic text-sm">
              {children}
            </blockquote>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-3 ml-5 space-y-1.5 list-disc text-sm text-zinc-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-5 space-y-1.5 list-decimal text-sm text-zinc-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-sm text-zinc-300">{children}</li>,

          // Tables
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-zinc-800/60">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-zinc-800/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-medium text-zinc-400">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-zinc-300">{children}</td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-8 border-zinc-800" />,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-100 underline underline-offset-2 decoration-zinc-600 hover:decoration-zinc-300 transition-colors"
            >
              {children}
            </a>
          ),

          // Strong / Em
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-300">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
