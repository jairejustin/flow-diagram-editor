import { useRef, useCallback, useEffect } from "react";
import type { EdgeAnchor, position } from "../../lib/types";
import {
  useSelectEdge,
  useUpdateEdgeHead,
  useUpdateEdgeTail,
  useSetIsDraggingEdge,
  useSelectedEdgeId,
  useViewMode,
  useViewport,
  useHistory,
  useFlowStore,
} from "../../store/flowStore";
import { getAnchorPoint } from "../../lib/utils";
import { ALIGNMENT_THRESHOLD, PAN_LIMIT } from "../../lib/constants";

export function useEdgeDrag(
  edgeId: string,
  fromNodeId: string,
  toNodeId: string | undefined,
  storeEdgeTo: string | position,
  storeEdgeToAnchor: EdgeAnchor,
  storeEdgeFrom: string | position,
  storeEdgeFromAnchor: EdgeAnchor
) {
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const draggingEndRef = useRef<"from" | "to" | null>(null);
  const activePointerId = useRef<number | null>(null);
  const isAlignedRef = useRef<{ x: boolean; y: boolean }>({
    x: false,
    y: false,
  });

  const handlersRef = useRef<{
    onPointerMove: ((e: PointerEvent) => void) | null;
    onPointerUp: ((e: PointerEvent) => void) | null;
    onPointerCancel: ((e: PointerEvent) => void) | null;
  }>({
    onPointerMove: null,
    onPointerUp: null,
    onPointerCancel: null,
  });

  const selectEdge = useSelectEdge();
  const updateEdgeHead = useUpdateEdgeHead();
  const updateEdgeTail = useUpdateEdgeTail();
  const setIsDraggingEdge = useSetIsDraggingEdge();
  const selectedEdgeId = useSelectedEdgeId();
  const viewMode = useViewMode();
  const viewport = useViewport();
  const { pause, resume } = useHistory();

  const cleanupListeners = useCallback(() => {
    if (handlersRef.current.onPointerMove) {
      document.removeEventListener(
        "pointermove",
        handlersRef.current.onPointerMove
      );
      handlersRef.current.onPointerMove = null;
    }
    if (handlersRef.current.onPointerUp) {
      document.removeEventListener(
        "pointerup",
        handlersRef.current.onPointerUp
      );
      handlersRef.current.onPointerUp = null;
    }
    if (handlersRef.current.onPointerCancel) {
      document.removeEventListener(
        "pointercancel",
        handlersRef.current.onPointerCancel
      );
      handlersRef.current.onPointerCancel = null;
    }
    activePointerId.current = null;
    draggingEndRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  const onEdgeClick = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      selectEdge(edgeId === selectedEdgeId ? null : edgeId);
    },
    [edgeId, selectedEdgeId, selectEdge]
  );

  // imperatively fetch nodes to avoid re-rendering
  const getOppositePoint = useCallback(
    (draggingEnd: "from" | "to"): position | null => {
      const nodes = useFlowStore.getState().nodes;
      if (draggingEnd === "to") {
        if (typeof storeEdgeFrom === "string") {
          const fromNode = nodes.find((n) => n.id === storeEdgeFrom);
          if (!fromNode) return null;
          return getAnchorPoint(fromNode, storeEdgeFromAnchor);
        } else {
          return storeEdgeFrom;
        }
      } else {
        if (typeof storeEdgeTo === "string") {
          const toNode = nodes.find((n) => n.id === storeEdgeTo);
          if (!toNode) return null;
          return getAnchorPoint(toNode, storeEdgeToAnchor);
        } else {
          return storeEdgeTo;
        }
      }
    },
    [storeEdgeFrom, storeEdgeFromAnchor, storeEdgeTo, storeEdgeToAnchor]
  );

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = (clientX - pointerPosRef.current.x) / viewport.zoom;
      const dy = (clientY - pointerPosRef.current.y) / viewport.zoom;

      let newX = startPosRef.current.x + dx;
      let newY = startPosRef.current.y + dy;

      if (newX > PAN_LIMIT) newX = PAN_LIMIT;
      if (newX < -PAN_LIMIT) newX = -PAN_LIMIT;
      if (newY > PAN_LIMIT) newY = PAN_LIMIT;
      if (newY < -PAN_LIMIT) newY = -PAN_LIMIT;

      const draggingEnd = draggingEndRef.current;
      if (!draggingEnd) return;

      const oppositePoint = getOppositePoint(draggingEnd);

      if (oppositePoint) {
        const deltaX = Math.abs(newX - oppositePoint.x);
        const deltaY = Math.abs(newY - oppositePoint.y);

        if (deltaX < ALIGNMENT_THRESHOLD) {
          isAlignedRef.current.x = true;
          newX = oppositePoint.x;
        } else {
          isAlignedRef.current.x = false;
        }

        if (deltaY < ALIGNMENT_THRESHOLD) {
          isAlignedRef.current.y = true;
          newY = oppositePoint.y;
        } else {
          isAlignedRef.current.y = false;
        }
      }

      // COLLISION DETECTION WITH NODES
      // fetch nodes imperatively here so we don't need 'nodes' as a prop
      const allNodes = useFlowStore.getState().nodes;

      let snappedToNode = false;

      for (const node of allNodes) {
        const oppositeNodeId = draggingEnd === "to" ? fromNodeId : toNodeId;
        if (node.id === oppositeNodeId) continue;

        const { x, y } = node.position;
        const { width, height } = node;

        if (newX > x && newX < x + width && newY > y && newY < y + height) {
          const anchors: EdgeAnchor[] = [
            { side: "top" },
            { side: "bottom" },
            { side: "left" },
            { side: "right" },
          ];

          let bestAnchor = anchors[0];
          let minDist = Infinity;

          for (const anchor of anchors) {
            const anchorPoint = getAnchorPoint(node, anchor);
            const dist = Math.sqrt(
              Math.pow(newX - anchorPoint.x, 2) +
                Math.pow(newY - anchorPoint.y, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              bestAnchor = anchor;
            }
          }

          if (draggingEnd === "to") {
            updateEdgeHead(edgeId, node.id, bestAnchor);
          } else {
            updateEdgeTail(edgeId, node.id, bestAnchor);
          }
          snappedToNode = true;
          isAlignedRef.current = { x: false, y: false };
          break;
        }
      }

      if (!snappedToNode) {
        if (draggingEnd === "to") {
          updateEdgeHead(edgeId, { x: newX, y: newY });
        } else {
          updateEdgeTail(edgeId, { x: newX, y: newY });
        }
      }
    },
    [
      viewport.zoom,
      edgeId,
      fromNodeId,
      toNodeId,
      updateEdgeHead,
      updateEdgeTail,
      getOppositePoint,
    ]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();
    setIsDraggingEdge(false);
    isAlignedRef.current = { x: false, y: false };
    resume();
  }, [cleanupListeners, setIsDraggingEdge, resume]);

  const onPointerDownHead = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (activePointerId.current !== null) return;
      if (viewMode) return;

      cleanupListeners();

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      draggingEndRef.current = "to";

      let startX = 0;
      let startY = 0;

      if (typeof storeEdgeTo === "string") {
        // We need to resolve initial position if it's attached to a node
        // we use imperative store access here too if strictly needed,
        // but typically the Edge component passes the resolved coordinate.
        // However, useEdgeDrag doesn't receive the resolved coordinate,
        // it receives the store data. So we must resolve it.
        const nodes = useFlowStore.getState().nodes;
        const node = nodes.find((n) => n.id === storeEdgeTo);
        if (node) {
          const p = getAnchorPoint(node, storeEdgeToAnchor);
          startX = p.x;
          startY = p.y;
        }
      } else {
        startX = storeEdgeTo.x;
        startY = storeEdgeTo.y;
      }

      startPosRef.current = { x: startX, y: startY };

      setIsDraggingEdge(true);
      selectEdge(edgeId === selectedEdgeId ? null : edgeId);
      pause();

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onMove(e.clientX, e.clientY);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onEnd();
      };
      const onPointerCancel = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onEnd();
      };

      handlersRef.current.onPointerMove = onPointerMove;
      handlersRef.current.onPointerUp = onPointerUp;
      handlersRef.current.onPointerCancel = onPointerCancel;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    },
    [
      viewMode,
      selectedEdgeId,
      cleanupListeners,
      storeEdgeTo,
      storeEdgeToAnchor,
      setIsDraggingEdge,
      selectEdge,
      edgeId,
      pause,
      onMove,
      onEnd,
    ]
  );

  const onPointerDownTail = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      selectEdge(edgeId === selectedEdgeId ? null : edgeId);
      if (activePointerId.current !== null) return;
      if (viewMode) return;

      cleanupListeners();

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      draggingEndRef.current = "from";

      let startX = 0;
      let startY = 0;

      if (typeof storeEdgeFrom === "string") {
        const nodes = useFlowStore.getState().nodes;
        const node = nodes.find((n) => n.id === storeEdgeFrom);
        if (node) {
          const p = getAnchorPoint(node, storeEdgeFromAnchor);
          startX = p.x;
          startY = p.y;
        }
      } else {
        startX = storeEdgeFrom.x;
        startY = storeEdgeFrom.y;
      }

      startPosRef.current = { x: startX, y: startY };

      setIsDraggingEdge(true);
      selectEdge(edgeId === selectedEdgeId ? null : edgeId);
      pause();

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onMove(e.clientX, e.clientY);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onEnd();
      };
      const onPointerCancel = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onEnd();
      };

      handlersRef.current.onPointerMove = onPointerMove;
      handlersRef.current.onPointerUp = onPointerUp;
      handlersRef.current.onPointerCancel = onPointerCancel;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    },
    [
      viewMode,
      cleanupListeners,
      storeEdgeFrom,
      storeEdgeFromAnchor,
      setIsDraggingEdge,
      selectEdge,
      edgeId,
      pause,
      onMove,
      onEnd,
      selectedEdgeId,
    ]
  );

  return { onPointerDownHead, onPointerDownTail, onEdgeClick };
}
