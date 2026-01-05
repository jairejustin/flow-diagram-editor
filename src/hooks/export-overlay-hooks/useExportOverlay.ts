import { useState, useRef, useEffect, useCallback } from 'react';
import { useExport } from './useExport';
import { useFlowStore } from '../../store/flowStore';
import type { Rectangle, ResizeHandle } from '../../lib/types';

type ButtonPlacement = {
  position: 'top' | 'bottom' | 'left' | 'right' | 'inside';
  isInside: boolean;
};

export function useExportOverlay() {
  const [selection, setSelection] = useState<Rectangle | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [buttonPlacement, setButtonPlacement] = useState<ButtonPlacement>({
    position: 'bottom',
    isInside: false,
  });

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const isMobile = useFlowStore((s) => s.isMobile);

  const exportHook = useExport();
  const {
    exportFormat,
    setExportFormat,
    isExporting,
    isCopying,
    handleExport,
    handleCopy,
    handleClose,
  } = exportHook;

  const calculateButtonPlacement = useCallback((): ButtonPlacement => {
    if (!selection || !overlayRef.current) {
      return { position: 'bottom', isInside: false };
    }

    const viewport = overlayRef.current.getBoundingClientRect();
    const selectionArea = selection.width * selection.height;
    const viewportArea = viewport.width * viewport.height;
    const selectionRatio = selectionArea / viewportArea;

    if (selectionRatio > 0.7) {
      return { position: 'inside', isInside: true };
    }

    const spaceTop = selection.y;
    const spaceBottom = viewport.height - (selection.y + selection.height);
    const spaceLeft = selection.x;
    const spaceRight = viewport.width - (selection.x + selection.width);

    if (!isMobile) {
      const isWiderThanTall = viewport.width > viewport.height;

      if (isWiderThanTall) {
        if (selection.height > viewport.height * 0.6) {
          return spaceRight > spaceLeft
            ? { position: 'right', isInside: false }
            : { position: 'left', isInside: false };
        }
      }

      return spaceBottom > spaceTop
        ? { position: 'bottom', isInside: false }
        : { position: 'top', isInside: false };
    }

    return spaceBottom > spaceTop
      ? { position: 'bottom', isInside: false }
      : { position: 'top', isInside: false };
  }, [selection, isMobile]);

  useEffect(() => {
    if (selection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setButtonPlacement(calculateButtonPlacement());
    }
  }, [selection, calculateButtonPlacement]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (overlayRef.current === null) return;

    e.stopPropagation();

    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
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

    newSelection.x = Math.max(0, Math.min(newSelection.x, rect.width - 20));
    newSelection.y = Math.max(0, Math.min(newSelection.y, rect.height - 20));
    newSelection.width = Math.min(newSelection.width, rect.width - newSelection.x);
    newSelection.height = Math.min(newSelection.height, rect.height - newSelection.y);

    setSelection(newSelection);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && selection) {
      const width = x - startPoint.x;
      const height = y - startPoint.y;

      setSelection({
        x: width < 0 ? x : startPoint.x,
        y: height < 0 ? y : startPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    } else if (isDragging && selection) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

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

  const handlePointerUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(null);
  };

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

  const handleResizePointerDown = (e: React.PointerEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(handle);
  };

  const handleExportClick = useCallback(async () => {
    if (!selection || selection.width < 10 || selection.height < 10) return;
    await handleExport(selection);
  }, [selection, handleExport]);

  const handleCopyClick = async () => {
    if (!selection || selection.width < 10 || selection.height < 10) return;
    await handleCopy(selection);
  };

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

  return {
    overlayRef,
    selection,
    buttonPlacement,
    exportFormat,
    setExportFormat,
    isExporting,
    isCopying,
    handleExportClick,
    handleCopyClick,
    handleClose,
    // pointer & selection handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSelectionPointerDown,
    handleResizePointerDown,
  } as const;
}
