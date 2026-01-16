import { useRef, useCallback, useEffect } from "react";
import {
  useSetIsResizingNode,
  useUpdateNodeDimensions,
  useUpdateNodePosition,
} from "../../store/flowStore";
import type { position } from "../../lib/types";

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

type Size = { width: number; height: number };

export function useNodeResize(
  nodeId: string,
  position: position,
  width: number,
  height: number,
  scale: number
) {
  const startPointerRef = useRef<position>({ x: 0, y: 0 });
  const startPosRef = useRef<position>({ x: 0, y: 0 });
  const startSizeRef = useRef<Size>({ width: 0, height: 0 });
  const activeHandleRef = useRef<ResizeHandle | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const updateNodePosition = useUpdateNodePosition();
  const updateNodeSize = useUpdateNodeDimensions();
  const setIsResizingNode = useSetIsResizingNode();

  const handlersRef = useRef<{
    move: ((e: PointerEvent) => void) | null;
    end: ((e: PointerEvent) => void) | null;
  }>({
    move: null,
    end: null,
  });

  const cleanup = useCallback(() => {
    if (handlersRef.current.move) {
      document.removeEventListener("pointermove", handlersRef.current.move);
      handlersRef.current.move = null;
    }

    if (handlersRef.current.end) {
      document.removeEventListener("pointerup", handlersRef.current.end);
      document.removeEventListener("pointercancel", handlersRef.current.end);
      handlersRef.current.end = null;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    activePointerIdRef.current = null;
    activeHandleRef.current = null;
    setIsResizingNode(false);
  }, [setIsResizingNode]);

  useEffect(() => cleanup, [cleanup]);

  const applyResize = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeHandleRef.current) return;

      const dx = (clientX - startPointerRef.current.x) / scale;
      const dy = (clientY - startPointerRef.current.y) / scale;
      const handle = activeHandleRef.current;

      const minSize = 50;

      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;
      let newX = startPosRef.current.x;
      let newY = startPosRef.current.y;

      if (handle.includes("e")) {
        newWidth = Math.max(minSize, startSizeRef.current.width + dx);
      }

      if (handle.includes("w")) {
        const proposed = startSizeRef.current.width - dx;
        if (proposed >= minSize) {
          newWidth = proposed;
          newX = startPosRef.current.x + dx;
        }
      }

      if (handle.includes("s")) {
        newHeight = Math.max(minSize, startSizeRef.current.height + dy);
      }

      if (handle.includes("n")) {
        const proposed = startSizeRef.current.height - dy;
        if (proposed >= minSize) {
          newHeight = proposed;
          newY = startPosRef.current.y + dy;
        }
      }

      updateNodeSize(nodeId, newWidth, newHeight);
      updateNodePosition(nodeId, { x: newX, y: newY });
    },
    [nodeId, scale, updateNodePosition, updateNodeSize]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyResize(e.clientX, e.clientY);
      });
    },
    [applyResize]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      cleanup();
    },
    [cleanup]
  );

  const onResizeHandlePointerDown = useCallback(
    (e: React.PointerEvent, handle: ResizeHandle) => {
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      cleanup();

      activePointerIdRef.current = e.pointerId;
      activeHandleRef.current = handle;
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { ...position };
      startSizeRef.current = { width, height };

      setIsResizingNode(true);

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerUp);
    },
    [
      cleanup,
      height,
      onPointerMove,
      onPointerUp,
      position,
      setIsResizingNode,
      width,
    ]
  );

  return {
    onResizeHandlePointerDown,
  };
}
