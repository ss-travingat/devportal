'use client';

import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Copy,
  Check,
  Code,
  Eye,
  X,
  FileCode,
} from 'lucide-react';

interface MermaidBlockProps {
  code: string;
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // DOM references
  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const mermaidId = `mermaid-${rawId.replace(/:/g, '')}`;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize and render Mermaid SVG
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
    return () => {
      cancelled = true;
    };
  }, [code, mermaidId]);

  // Lock body scroll and handle Escape key when in fullscreen modal
  useEffect(() => {
    if (!isFullscreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 4.0));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.25));
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Non-passive wheel event listener on the active container to zoom smoothly without scrolling page
  useEffect(() => {
    const activeEl = isFullscreen ? modalContainerRef.current : containerRef.current;
    if (!activeEl) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setZoom((prevZoom) => {
        const next = Math.max(0.25, Math.min(4.0, Number((prevZoom * zoomFactor).toFixed(2))));
        return next;
      });
    };

    activeEl.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      activeEl.removeEventListener('wheel', onWheel);
    };
  }, [isFullscreen, svg, showCode]);

  // Pan actions
  const handlePan = useCallback((dx: number, dy: number) => {
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 4.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.25));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary left click
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Copy diagram source code
  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="my-6 px-4 py-3 border border-red-900/50 rounded-lg bg-zinc-950 text-xs text-zinc-300 font-mono overflow-auto">
        <p className="text-red-400 mb-1 font-semibold flex items-center gap-1.5">
          <span>⚠</span> Mermaid render error:
        </p>
        <pre className="whitespace-pre-wrap text-red-300/80 mb-3">{error}</pre>
        <p className="text-zinc-500 text-[11px] font-sans uppercase tracking-wider mb-1">Source Code:</p>
        <pre className="whitespace-pre-wrap text-zinc-400 bg-zinc-900/80 p-3 rounded border border-zinc-800">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 px-4 py-8 border border-zinc-800 rounded-lg bg-zinc-950 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500">
        <span className="animate-pulse text-lg">◌</span>
        <span>Rendering diagram...</span>
      </div>
    );
  }

  // Floating GitHub-style Controller Component (matches reference image)
  const GitHubControlPad = ({ inModal = false }: { inModal?: boolean }) => (
    <div
      className={`absolute select-none z-20 flex flex-col items-end gap-2 ${
        inModal ? 'bottom-6 right-6' : 'bottom-4 right-4'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top mini-bar: Fit View, Copy, Fullscreen Toggle */}
      <div className="flex items-center gap-0.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1 shadow-2xl">
        <button
          type="button"
          onClick={handleReset}
          title="Fit to view / Reset"
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? 'Source copied!' : 'Copy diagram source'}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors relative"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen Popup'}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* D-Pad & Zoom Buttons Container */}
      <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1.5 shadow-2xl">
        {/* 3x3 D-Pad */}
        <div className="grid grid-cols-3 gap-1 w-[80px] h-[80px]">
          <div />
          <button
            type="button"
            onClick={() => handlePan(0, 60)}
            title="Pan Up"
            className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => handlePan(60, 0)}
            title="Pan Left"
            className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset Pan & Zoom (100%)"
            className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlePan(-60, 0)}
            title="Pan Right"
            className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => handlePan(0, -60)}
            title="Pan Down"
            className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <div />
        </div>

        {/* Separator */}
        <div className="w-px h-16 bg-zinc-800" />

        {/* Zoom In & Out */}
        <div className="flex flex-col justify-between h-[80px]">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="flex items-center justify-center w-7 h-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="flex items-center justify-center w-7 h-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Fullscreen Modal Render (via Portal to body)
  const renderFullscreenModal = () => {
    if (!isFullscreen || !mounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col animate-in fade-in duration-150">
        {/* Top Header Bar */}
        <div className="h-14 px-4 sm:px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
              <FileCode className="w-3.5 h-3.5 text-zinc-300" />
              Mermaid Diagram
            </span>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {Math.round(zoom * 100)}%
              </span>
              <span>•</span>
              <span className="text-zinc-500">Drag to pan, wheel to zoom</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-md transition-colors"
            >
              {showCode ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
              <span>{showCode ? 'View Diagram' : 'View Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-md transition-colors ml-2"
              title="Close Fullscreen (Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Modal Canvas Body */}
        <div
          ref={modalContainerRef}
          className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center select-none"
          style={{
            cursor: showCode ? 'default' : isDragging ? 'grabbing' : 'grab',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          onMouseDown={showCode ? undefined : handleMouseDown}
          onMouseMove={showCode ? undefined : handleMouseMove}
          onMouseUp={showCode ? undefined : handleMouseUp}
          onMouseLeave={showCode ? undefined : handleMouseUp}
          onDoubleClick={showCode ? undefined : handleReset}
        >
          {showCode ? (
            <div className="w-full max-w-4xl max-h-[85vh] p-6 overflow-auto">
              <pre className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono p-5 rounded-lg whitespace-pre-wrap leading-relaxed">
                {code}
              </pre>
            </div>
          ) : (
            <>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                className="inline-block pointer-events-none [&>svg]:pointer-events-auto [&>svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <GitHubControlPad inModal={true} />
            </>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="my-6 border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden flex flex-col">
        {/* Inline Header Bar */}
        <div className="h-10 px-3 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-zinc-400" />
              Diagram
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-zinc-400 text-[11px]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              title={showCode ? 'View Rendered Diagram' : 'View Mermaid Source Code'}
              className="px-2 py-1 hover:text-white hover:bg-zinc-800/80 rounded transition-colors text-[11px] flex items-center gap-1"
            >
              {showCode ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
              <span>{showCode ? 'Diagram' : 'Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy Mermaid Source'}
              className="px-2 py-1 hover:text-white hover:bg-zinc-800/80 rounded transition-colors text-[11px] flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 text-white bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] font-medium transition-colors"
              title="Expand to Fullscreen Popup"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Inline Viewport */}
        <div
          ref={containerRef}
          className="relative w-full h-[460px] overflow-hidden flex items-center justify-center select-none bg-zinc-950"
          style={{
            cursor: showCode ? 'default' : isDragging ? 'grabbing' : 'grab',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
          onMouseDown={showCode ? undefined : handleMouseDown}
          onMouseMove={showCode ? undefined : handleMouseMove}
          onMouseUp={showCode ? undefined : handleMouseUp}
          onMouseLeave={showCode ? undefined : handleMouseUp}
          onDoubleClick={showCode ? undefined : handleReset}
        >
          {showCode ? (
            <div className="w-full h-full p-4 overflow-auto">
              <pre className="text-zinc-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {code}
              </pre>
            </div>
          ) : (
            <>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                className="inline-block pointer-events-none [&>svg]:pointer-events-auto [&>svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <GitHubControlPad inModal={false} />
            </>
          )}
        </div>
      </div>

      {renderFullscreenModal()}
    </>
  );
}

