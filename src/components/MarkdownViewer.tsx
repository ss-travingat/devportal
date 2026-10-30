'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownViewerProps {
  content: string;
}

// Mermaid block renderer: renders a Mermaid diagram from a code block with lang="mermaid"
function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const rawId = useId();
  const mermaidId = `mermaid-${rawId.replace(/:/g, '')}`;

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          darkMode: true,
          themeVariables: {
            primaryColor: '#27272a',
            primaryTextColor: '#f4f4f5',
            primaryBorderColor: '#52525b',
            lineColor: '#71717a',
            secondaryColor: '#18181b',
            tertiaryColor: '#1c1c1f',
            background: '#18181b',
            mainBkg: '#27272a',
            nodeBorder: '#52525b',
            clusterBkg: '#1c1c1f',
            titleColor: '#f4f4f5',
            edgeLabelBackground: '#1c1c1f',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          },
        });
        const { svg: rendered } = await mermaid.render(mermaidId, code);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code, mermaidId]);

  if (error) {
    return (
      <div className="my-4 px-4 py-3 border border-zinc-800 rounded-md bg-zinc-950 text-xs text-zinc-400 font-mono overflow-auto">
        <p className="text-zinc-300 mb-1 font-medium">Mermaid render error:</p>
        <pre className="whitespace-pre-wrap">{error}</pre>
        <p className="text-zinc-500 mt-2 text-[11px]">Source:</p>
        <pre className="whitespace-pre-wrap text-zinc-500">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 px-4 py-4 border border-zinc-800 rounded-md bg-zinc-950 flex items-center gap-2 text-xs text-zinc-500">
        <span className="animate-pulse">◌</span>
        <span>Rendering diagram...</span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-6 p-4 border border-zinc-800 rounded-lg bg-zinc-950 overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
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

          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mt-8 mb-4 pb-3 border-b border-zinc-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white mt-7 mb-3 pb-2 border-b border-zinc-800/60">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-zinc-100 mt-6 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">
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
