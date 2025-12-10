import { useRef, useCallback, useEffect } from "react";
import { useFlowStore } from "../../store/flowStore";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export function useNodeResize(
  nodeId: string,
  position: { x: number; y: number },
  width: number,
  height: number,
  scale: number
) {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const resizeHandleRef = useRef<ResizeHandle | null>(null);
  const handlersRef = useRef<{
    onMouseMove: ((e: MouseEvent) => void) | null;
    onMouseUp: ((e: MouseEvent) => void) | null;
    onTouchMove: ((e: TouchEvent) => void) | null;
    onTouchEnd: ((e: TouchEvent) => void) | null;
  }>({
    onMouseMove: null,
    onMouseUp: null,
    onTouchMove: null,
    onTouchEnd: null,
  });

  const updateNodePosition = useFlowStore((state) => state.updateNodePosition);
  const updateNodeSize = useFlowStore((state) => state.updateNodeDimensions);
  const setIsResizingNode = useFlowStore((state) => state.setIsResizingNode);

  const cleanupListeners = useCallback(() => {
    if (handlersRef.current.onMouseMove) {
      document.removeEventListener("mousemove", handlersRef.current.onMouseMove);
      handlersRef.current.onMouseMove = null;
    }
    if (handlersRef.current.onMouseUp) {
      document.removeEventListener("mouseup", handlersRef.current.onMouseUp);
      handlersRef.current.onMouseUp = null;
    }
    if (handlersRef.current.onTouchMove) {
      document.removeEventListener("touchmove", handlersRef.current.onTouchMove);
      handlersRef.current.onTouchMove = null;
    }
    if (handlersRef.current.onTouchEnd) {
      document.removeEventListener("touchend", handlersRef.current.onTouchEnd);
      handlersRef.current.onTouchEnd = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  const onResize = useCallback(
    (clientX: number, clientY: number) => {
      if (!resizeHandleRef.current) return;

      const dx = (clientX - mousePosRef.current.x) / scale;
      const dy = (clientY - mousePosRef.current.y) / scale;
      const handle = resizeHandleRef.current;

      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;
      let newX = startPosRef.current.x;
      let newY = startPosRef.current.y;

      const minSize = 50;

      if (handle.includes("e")) {
        newWidth = Math.max(minSize, startSizeRef.current.width + dx);
      }
      if (handle.includes("w")) {
        const proposedWidth = startSizeRef.current.width - dx;
        if (proposedWidth >= minSize) {
          newWidth = proposedWidth;
          newX = startPosRef.current.x + dx;
        }
      }
      if (handle.includes("s")) {
        newHeight = Math.max(minSize, startSizeRef.current.height + dy);
      }
      if (handle.includes("n")) {
        const proposedHeight = startSizeRef.current.height - dy;
        if (proposedHeight >= minSize) {
          newHeight = proposedHeight;
          newY = startPosRef.current.y + dy;
        }
      }

      updateNodeSize(nodeId, newWidth, newHeight);
      updateNodePosition(nodeId, { x: newX, y: newY });
    },
    [nodeId, scale, updateNodePosition, updateNodeSize]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();
    setIsResizingNode(false);
    resizeHandleRef.current = null;
  }, [cleanupListeners, setIsResizingNode]);

  const onResizeHandleMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();

      cleanupListeners();

      mousePosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: position.x, y: position.y };
      startSizeRef.current = { width, height };
      resizeHandleRef.current = handle;
      setIsResizingNode(true);

      const onMouseMove = (e: MouseEvent) => {
        onResize(e.clientX, e.clientY);
      };

      const onMouseUp = () => {
        onEnd();
      };

      handlersRef.current.onMouseMove = onMouseMove;
      handlersRef.current.onMouseUp = onMouseUp;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [height, onEnd, onResize, position.x, position.y, setIsResizingNode, width, cleanupListeners]
  );

  const onResizeHandleTouchStart = useCallback(
    (e: React.TouchEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();

      cleanupListeners();

      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { x: position.x, y: position.y };
      startSizeRef.current = { width, height };
      resizeHandleRef.current = handle;
      setIsResizingNode(true);

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        onResize(e.touches[0].clientX, e.touches[0].clientY);
      };

      const onTouchEnd = () => {
        onEnd();
      };

      handlersRef.current.onTouchMove = onTouchMove;
      handlersRef.current.onTouchEnd = onTouchEnd;

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [height, onEnd, onResize, position.x, position.y, setIsResizingNode, width, cleanupListeners]
  );

  return { onResizeHandleMouseDown, onResizeHandleTouchStart };
}