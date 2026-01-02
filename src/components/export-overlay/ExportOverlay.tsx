import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { useExport } from '../../hooks/export-overlay-hooks/useExport';
import './ExportOverlay.css';

type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function ExportOverlay() {
  const [selection, setSelection] = useState<Rectangle | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    exportFormat,
    setExportFormat,
    isExporting,
    isCopying,
    handleExport,
    handleCopy,
    handleClose,
  } = useExport();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target !== overlayRef.current) return;

    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && selection) {
      // Drawing new selection
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      
      setSelection({
        x: width < 0 ? x : startPoint.x,
        y: height < 0 ? y : startPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    } else if (isDragging && selection) {
      // Dragging existing selection
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      
      // Constrain to overlay bounds
      const maxX = rect.width - selection.width;
      const maxY = rect.height - selection.height;
      
      setSelection({
        ...selection,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    } else if (isResizing && selection) {
      handleResize(x, y);
    }
  };

  const handleResize = (x: number, y: number) => {
    if (!selection || !isResizing || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const newSelection = { ...selection };
    let newWidth = 0;
    let newHeight = 0;

    switch (isResizing) {
      case 'se': 
        newSelection.width = Math.max(20, x - selection.x);
        newSelection.height = Math.max(20, y - selection.y);
        break;
      case 'sw': 
        newWidth = Math.max(20, selection.x + selection.width - x);
        newSelection.x = selection.x + selection.width - newWidth;
        newSelection.width = newWidth;
        newSelection.height = Math.max(20, y - selection.y);
        break;
      case 'ne': 
        newSelection.width = Math.max(20, x - selection.x);
        newHeight = Math.max(20, selection.y + selection.height - y);
        newSelection.y = selection.y + selection.height - newHeight;
        newSelection.height = newHeight;
        break;
      case 'nw':
        newWidth = Math.max(20, selection.x + selection.width - x);
        newHeight = Math.max(20, selection.y + selection.height - y);
        newSelection.x = selection.x + selection.width - newWidth;
        newSelection.y = selection.y + selection.height - newHeight;
        newSelection.width = newWidth;
        newSelection.height = newHeight;
        break;
      case 'n':
        newHeight = Math.max(20, selection.y + selection.height - y);
        newSelection.y = selection.y + selection.height - newHeight;
        newSelection.height = newHeight;
        break;
      case 's':
        newSelection.height = Math.max(20, y - selection.y);
        break;
      case 'e':
        newSelection.width = Math.max(20, x - selection.x);
        break;
      case 'w':
        newWidth = Math.max(20, selection.x + selection.width - x);
        newSelection.x = selection.x + selection.width - newWidth;
        newSelection.width = newWidth;
        break;
    }

    // Constrain to bounds
    newSelection.x = Math.max(0, Math.min(newSelection.x, rect.width - 20));
    newSelection.y = Math.max(0, Math.min(newSelection.y, rect.height - 20));
    newSelection.width = Math.min(newSelection.width, rect.width - newSelection.x);
    newSelection.height = Math.min(newSelection.height, rect.height - newSelection.y);

    setSelection(newSelection);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(null);
  };

  // Start dragging selection
  const handleSelectionPointerDown = (e: React.PointerEvent) => {
    if (!selection) return;
    e.stopPropagation();

    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragOffset({
      x: x - selection.x,
      y: y - selection.y,
    });
  };

  // Start resizing
  const handleResizePointerDown = (e: React.PointerEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(handle);
  };

  // Handle export click
  const handleExportClick = useCallback(async () => {
    if (!selection || selection.width < 10 || selection.height < 10) return;
    await handleExport(selection);
  }, [selection, handleExport]);

  // Handle copy click
  const handleCopyClick = async () => {
    if (!selection || selection.width < 10 || selection.height < 10) return;
    await handleCopy(selection);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && selection) {
        handleExportClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, handleClose, handleExportClick]);

  return (
    <div
      ref={overlayRef}
      className="export-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dark overlay with cutout for selection */}
      <svg className="export-overlay__mask" width="100%" height="100%">
        <defs>
          <mask id="selection-mask">
            <rect width="100%" height="100%" fill="white" />
            {selection && (
              <rect
                x={selection.x}
                y={selection.y}
                width={selection.width}
                height={selection.height}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#selection-mask)"
        />
      </svg>

      {/* Selection rectangle */}
      {selection && selection.width > 0 && selection.height > 0 && (
        <div
          className="export-overlay__selection"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
          onPointerDown={handleSelectionPointerDown}
        >
          {/* Resize handles */}
          <div className="export-overlay__handle export-overlay__handle--nw" onPointerDown={(e) => handleResizePointerDown(e, 'nw')} />
          <div className="export-overlay__handle export-overlay__handle--n" onPointerDown={(e) => handleResizePointerDown(e, 'n')} />
          <div className="export-overlay__handle export-overlay__handle--ne" onPointerDown={(e) => handleResizePointerDown(e, 'ne')} />
          <div className="export-overlay__handle export-overlay__handle--e" onPointerDown={(e) => handleResizePointerDown(e, 'e')} />
          <div className="export-overlay__handle export-overlay__handle--se" onPointerDown={(e) => handleResizePointerDown(e, 'se')} />
          <div className="export-overlay__handle export-overlay__handle--s" onPointerDown={(e) => handleResizePointerDown(e, 's')} />
          <div className="export-overlay__handle export-overlay__handle--sw" onPointerDown={(e) => handleResizePointerDown(e, 'sw')} />
          <div className="export-overlay__handle export-overlay__handle--w" onPointerDown={(e) => handleResizePointerDown(e, 'w')} />

          {/* Dimensions label */}
          <div className="export-overlay__dimensions">
            {Math.round(selection.width)} × {Math.round(selection.height)}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="export-overlay__toolbar">
        <div className="export-overlay__format-selector">
          <button
            className={`export-overlay__format-btn ${exportFormat === 'png' ? 'active' : ''}`}
            onClick={() => setExportFormat('png')}
          >
            PNG
          </button>
          <button
            className={`export-overlay__format-btn ${exportFormat === 'jpeg' ? 'active' : ''}`}
            onClick={() => setExportFormat('jpeg')}
          >
            JPEG
          </button>
        </div>

        <div className="export-overlay__actions">
          <button
            className="export-overlay__btn export-overlay__btn--copy"
            onClick={handleCopyClick}
            disabled={!selection || selection.width < 10 || isCopying}
            title="Copy to clipboard (Ctrl+C)"
          >
            <Copy size={18} />
            {isCopying ? 'Copied!' : 'Copy'}
          </button>

          <button
            className="export-overlay__btn export-overlay__btn--export"
            onClick={handleExportClick}
            disabled={!selection || selection.width < 10 || isExporting}
            title="Export image (Enter)"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          <button
            className="export-overlay__btn export-overlay__btn--close"
            onClick={handleClose}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Instructions */}
      {!selection && (
        <div className="export-overlay__instructions">
          <p>Click and drag to select an area to export</p>
          <p className="export-overlay__instructions-hint">Press ESC to cancel</p>
        </div>
      )}
    </div>
  );
}