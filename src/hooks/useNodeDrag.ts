import { useRef, useCallback, useEffect } from "react";
import { useFlowStore } from "../store/flowStore";

export function useNodeDrag(
  nodeId: string,
  position: { x: number; y: number },
  editing: boolean
) {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
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

  const selectNode = useCallback(
    (id: string | null) => useFlowStore.setState({ selectedNodeId: id }),
    []
  );
  const updateNodePosition = useFlowStore((state) => state.updateNodePosition);
  const setIsDraggingNode = useFlowStore((state) => state.setIsDraggingNode);

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

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - mousePosRef.current.x;
      const dy = clientY - mousePosRef.current.y;

      updateNodePosition(nodeId, {
        x: startPosRef.current.x + dx,
        y: startPosRef.current.y + dy,
      });
    },
    [nodeId, updateNodePosition]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();

    const currentSelectedId = useFlowStore.getState().selectedNodeId;
    if (nodeId === currentSelectedId) {
      selectNode(null);
    } else {
      selectNode(nodeId);
    }

    setIsDraggingNode(false);
  }, [nodeId, selectNode, setIsDraggingNode, cleanupListeners]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editing) return;

      cleanupListeners();

      mousePosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: position.x, y: position.y };
      setIsDraggingNode(true);

      const onMouseMove = (e: MouseEvent) => {
        onMove(e.clientX, e.clientY);
      };

      const onMouseUp = () => {
        onEnd();
      };

      handlersRef.current.onMouseMove = onMouseMove;
      handlersRef.current.onMouseUp = onMouseUp;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [editing, position.x, position.y, setIsDraggingNode, onMove, onEnd, cleanupListeners]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (editing) return;

      cleanupListeners();

      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { x: position.x, y: position.y };
      setIsDraggingNode(true);

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      };

      const onTouchEnd = () => {
        onEnd();
      };

      handlersRef.current.onTouchMove = onTouchMove;
      handlersRef.current.onTouchEnd = onTouchEnd;

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [editing, position.x, position.y, setIsDraggingNode, onMove, onEnd, cleanupListeners]
  );

  return { onMouseDown, onTouchStart };
}