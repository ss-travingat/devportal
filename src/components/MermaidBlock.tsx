'use client';

import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Copy, Check, X } from 'lucide-react';

interface MermaidBlockProps {
  code: string;
}

interface ToolbarProps {
  inFullscreen?: boolean;
  isCopying: boolean;
  copied: boolean;
  isFullscreen: boolean;
  onZoomIn: (e?: React.MouseEvent) => void;
  onZoomOut: (e?: React.MouseEvent) => void;
  onCopyAsImage: (e?: React.MouseEvent) => void;
  onToggleFullscreen: (e?: React.MouseEvent) => void;
}

// Standalone Toolbar Component (declared outside render per React 19 rules)
function DiagramToolbar({
  inFullscreen = false,
  isCopying,
  copied,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onCopyAsImage,
  onToggleFullscreen,
}: ToolbarProps) {
  return (
    <div
      className={`absolute z-30 flex items-center gap-1 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-lg p-1 shadow-2xl text-zinc-300 select-none ${
        inFullscreen ? 'top-4 right-4' : 'top-3 right-3'
      }`}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom In (+)"
        aria-label="Zoom In"
        className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom Out (-)"
        aria-label="Zoom Out"
        className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-zinc-700 mx-0.5" />

      <button
        type="button"
        onClick={onCopyAsImage}
        disabled={isCopying}
        title={copied ? 'Copied image to clipboard!' : 'Copy diagram as PNG image'}
        aria-label="Copy diagram as image"
        className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer relative"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Open Fullscreen Popup'}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen Popup'}
        className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // DOM references
  const inlineContainerRef = useRef<HTMLDivElement>(null);
  const modalCanvasRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const mermaidId = `mermaid-${rawId.replace(/:/g, '')}`;

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

  // Window-level mouse listeners for reliable drag-to-pan across the entire viewport
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // Fullscreen modal scroll lock and Escape key handler
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

  // Non-passive wheel event listener to smoothly zoom without scrolling the parent page
  useEffect(() => {
    const activeEl = isFullscreen ? modalCanvasRef.current : inlineContainerRef.current;
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
  }, [isFullscreen, svg]);

  // Zoom and Fullscreen Actions
  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 4.0));
  }, []);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.25));
  }, []);

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFullscreen((prev) => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return !prev;
    });
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Canvas Drag Start Handler
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left-click only
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  // Copy diagram as high-resolution PNG image to clipboard
  const handleCopyAsImage = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!svg || isCopying) return;

    try {
      setIsCopying(true);

      // Find rendered SVG element
      const activeEl = isFullscreen ? modalCanvasRef.current : inlineContainerRef.current;
      const svgEl = activeEl?.querySelector('svg');

      let width = 1200;
      let height = 800;

      if (svgEl) {
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            width = parts[2];
            height = parts[3];
          }
        } else {
          const bbox = svgEl.getBoundingClientRect();
          if (bbox.width > 0 && bbox.height > 0) {
            width = Math.round(bbox.width);
            height = Math.round(bbox.height);
          }
        }
      }

      // Prepare SVG string with explicit dimensions and XML namespace
      let svgMarkup = svg;
      if (!svgMarkup.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgMarkup = svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      svgMarkup = svgMarkup.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
        const clean = attrs
          .replace(/\bwidth="[^"]*"/gi, '')
          .replace(/\bheight="[^"]*"/gi, '');
        return `<svg${clean} width="${width}" height="${height}">`;
      });

      // Load into an HTML Image element via Blob URL
      const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (err) => reject(err);
        img.src = blobUrl;
      });

      // Render onto high-DPI canvas (2x) with dark background padding
      const dpr = 2;
      const padding = 32 * dpr;
      const canvas = document.createElement('canvas');
      canvas.width = width * dpr + padding * 2;
      canvas.height = height * dpr + padding * 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Crisp background matching portal dark palette
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw SVG centered
      ctx.drawImage(img, padding, padding, width * dpr, height * dpr);
      URL.revokeObjectURL(blobUrl);

      // Export as PNG blob
      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!pngBlob) throw new Error('Canvas to PNG blob conversion failed');

      // Write directly to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob }),
        ]);
      } else {
        // Fallback: trigger direct PNG download
        const downloadUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'diagram.png';
        a.click();
        URL.revokeObjectURL(downloadUrl);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy diagram as image:', err);
    } finally {
      setIsCopying(false);
    }
  };

  if (error) {
    return (
      <div className="my-6 px-4 py-3 border border-red-900/50 rounded-lg bg-zinc-950 text-xs text-zinc-300 font-mono overflow-auto">
        <p className="text-red-400 mb-1 font-semibold">Mermaid render error:</p>
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

  return (
    <>
      {/* Inline Diagram View */}
      <div className="relative my-6 w-full h-[460px] border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shadow-lg">
        {/* Top-Left Zoom Level & Feedback Indicator */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 px-2 py-0.5 rounded shadow-sm">
            {Math.round(zoom * 100)}%
          </span>
          {copied && (
            <span className="font-sans text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-in fade-in">
              <Check className="w-3 h-3" />
              Copied image to clipboard!
            </span>
          )}
        </div>

        {/* Floating Top-Right Controls */}
        <DiagramToolbar
          inFullscreen={false}
          isCopying={isCopying}
          copied={copied}
          isFullscreen={isFullscreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCopyAsImage={handleCopyAsImage}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Draggable Interactive Canvas */}
        <div
          ref={inlineContainerRef}
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
          onMouseDown={handleCanvasMouseDown}
          onDoubleClick={handleReset}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
            className="inline-block pointer-events-none [&>svg]:pointer-events-auto [&>svg]:max-w-none"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        {/* Subtle Bottom Help Hint */}
        <div className="absolute bottom-2 left-3 z-20 pointer-events-none text-[11px] text-zinc-500">
          Drag to pan • Scroll to zoom • Double-click to reset
        </div>
      </div>

      {/* Fullscreen Popup Modal */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-md flex flex-col animate-in fade-in duration-150 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) toggleFullscreen();
          }}
        >
          {/* Top Header Bar */}
          <div className="h-14 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md z-30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                Architecture Diagram
              </span>
              <span className="font-mono text-zinc-300 text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {Math.round(zoom * 100)}%
              </span>
              {copied && (
                <span className="font-sans text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Copied image to clipboard!
                </span>
              )}
            </div>

            {/* Header Right Controls: Zoom In, Zoom Out, Copy Image, Close */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-700/80 rounded-lg p-1 text-zinc-300"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In (+)"
                  aria-label="Zoom In"
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out (-)"
                  aria-label="Zoom Out"
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-zinc-700 mx-0.5" />

                <button
                  type="button"
                  onClick={handleCopyAsImage}
                  disabled={isCopying}
                  title={copied ? 'Copied image to clipboard!' : 'Copy diagram as PNG image'}
                  aria-label="Copy diagram as image"
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title="Exit Fullscreen (Esc)"
                  aria-label="Exit Fullscreen"
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                title="Close Fullscreen (Esc)"
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Interactive Canvas */}
          <div
            ref={modalCanvasRef}
            className="flex-1 relative overflow-hidden flex items-center justify-center"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
            onMouseDown={handleCanvasMouseDown}
            onDoubleClick={handleReset}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.12s ease-out',
              }}
              className="inline-block pointer-events-none [&>svg]:pointer-events-auto [&>svg]:max-w-none"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
