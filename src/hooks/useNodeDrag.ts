import { useRef, useCallback, useEffect } from "react";
import { useFlowStore } from "../store/flowStore";

export function useNodeDrag(
  nodeId: string,
  position: { x: number; y: number },
  editing: boolean
) {
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const handlersRef = useRef<{
    onPointerMove: ((e: PointerEvent) => void) | null;
    onPointerUp: ((e: PointerEvent) => void) | null;
    onPointerCancel: ((e: PointerEvent) => void) | null;
  }>({
    onPointerMove: null,
    onPointerUp: null,
    onPointerCancel: null,
  });

  const selectNode = useCallback(
    (id: string | null) => useFlowStore.setState({ selectedNodeId: id, selectedEdgeId: null }),
    []
  );
  const updateNodePosition = useFlowStore((state) => state.updateNodePosition);
  const setIsDraggingNode = useFlowStore((state) => state.setIsDraggingNode);

  const cleanupListeners = useCallback(() => {
    if (handlersRef.current.onPointerMove) {
      document.removeEventListener("pointermove", handlersRef.current.onPointerMove);
      handlersRef.current.onPointerMove = null;
    }
    if (handlersRef.current.onPointerUp) {
      document.removeEventListener("pointerup", handlersRef.current.onPointerUp);
      handlersRef.current.onPointerUp = null;
    }
    if (handlersRef.current.onPointerCancel) {
      document.removeEventListener("pointercancel", handlersRef.current.onPointerCancel);
      handlersRef.current.onPointerCancel = null;
    }
    activePointerId.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - pointerPosRef.current.x;
      const dy = clientY - pointerPosRef.current.y;

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

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (editing) return;

      // check for another pointer
      if (activePointerId.current !== null) {
        return;
      }

      cleanupListeners();

      // get the pointer for tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: position.x, y: position.y };
      setIsDraggingNode(true);

      const onPointerMove = (e: PointerEvent) => {
        // only the captured pointer
        if (e.pointerId !== activePointerId.current) {
          return;
        }
        onMove(e.clientX, e.clientY);
      };

      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) {
          return;
        }
        onEnd();
      };

      const onPointerCancel = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) {
          return;
        }
        onEnd();
      };

      handlersRef.current.onPointerMove = onPointerMove;
      handlersRef.current.onPointerUp = onPointerUp;
      handlersRef.current.onPointerCancel = onPointerCancel;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    },
    [editing, position.x, position.y, setIsDraggingNode, onMove, onEnd, cleanupListeners]
  );

  return { onPointerDown };
}