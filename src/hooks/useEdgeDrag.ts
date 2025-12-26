import { useRef, useCallback, useEffect } from "react";
import type { NodeData, EdgeAnchor, position } from "../lib/types";
import { useFlowStore } from "../store/flowStore";
import { getAnchorPoint } from "../lib/utils";
import { ALIGNMENT_THRESHOLD } from "../lib/constants";

export function useEdgeDrag(
  edgeId: string,
  fromNodeId: string,
  toNodeId: string | undefined,
  storeEdgeTo: string | position,
  storeEdgeToAnchor: EdgeAnchor,
  storeEdgeFrom: string | position,
  storeEdgeFromAnchor: EdgeAnchor,
  nodes: NodeData[]
) {
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const draggingEndRef = useRef<"from" | "to" | null>(null);
  const activePointerId = useRef<number | null>(null);
  const isAlignedRef = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });
  const handlersRef = useRef<{
    onPointerMove: ((e: PointerEvent) => void) | null;
    onPointerUp: ((e: PointerEvent) => void) | null;
    onPointerCancel: ((e: PointerEvent) => void) | null;
  }>({
    onPointerMove: null,
    onPointerUp: null,
    onPointerCancel: null,
  });

  const selectEdge = useCallback(
    (id: string | null) => useFlowStore.setState({ selectedEdgeId: id }),
    []
  );

  const allNodes = useFlowStore((state) => state.nodes);
  const updateEdgeHead = useFlowStore((state) => state.updateEdgeHead);
  const updateEdgeTail = useFlowStore((state) => state.updateEdgeTail);
  const setIsDraggingEdge = useFlowStore((state) => state.setIsDraggingEdge);
  const selectedEdgeId = useFlowStore((state) => state.selectedEdgeId)
  const selectNode = useFlowStore((state) => state.selectNode);
  const viewMode = useFlowStore((state) => state.viewMode);

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

  const onEdgeClick = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      selectNode(null);
      
      if (selectedEdgeId === edgeId) {
        useFlowStore.setState({ selectedEdgeId: null });
      } else {
        useFlowStore.setState({ selectedEdgeId: edgeId });
      }
    },
    [edgeId, selectedEdgeId, selectNode]
  );

  // Get the opposite endpoint position
  const getOppositePoint = useCallback((draggingEnd: "from" | "to"): position | null => {
    if (draggingEnd === "to") {
      // We're dragging the head, so get the tail position
      if (typeof storeEdgeFrom === "string") {
        const fromNode = nodes.find((n) => n.id === storeEdgeFrom);
        if (!fromNode) return null;
        return getAnchorPoint(fromNode, storeEdgeFromAnchor);
      } else {
        return storeEdgeFrom;
      }
    } else {
      // We're dragging the tail, so get the head position
      if (typeof storeEdgeTo === "string") {
        const toNode = nodes.find((n) => n.id === storeEdgeTo);
        if (!toNode) return null;
        return getAnchorPoint(toNode, storeEdgeToAnchor);
      } else {
        return storeEdgeTo;
      }
    }
  }, [nodes, storeEdgeFrom, storeEdgeFromAnchor, storeEdgeTo, storeEdgeToAnchor]);

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = (clientX - pointerPosRef.current.x) / useFlowStore.getState().viewport.zoom;
      const dy = (clientY - pointerPosRef.current.y) / useFlowStore.getState().viewport.zoom;

      let newX = startPosRef.current.x + dx;
      let newY = startPosRef.current.y + dy;

      const draggingEnd = draggingEndRef.current;
      if (!draggingEnd) return;

      // alignment checking
      const oppositePoint = getOppositePoint(draggingEnd);

      if (oppositePoint) {
        const deltaX = Math.abs(newX - oppositePoint.x);
        const deltaY = Math.abs(newY - oppositePoint.y);

        // X alignment
        if (isAlignedRef.current.x) {
          if (deltaX > ALIGNMENT_THRESHOLD * 2) {
            isAlignedRef.current.x = false;
          } else {
            newX = oppositePoint.x;
          }
        } else {
          if (deltaX < ALIGNMENT_THRESHOLD) {
            isAlignedRef.current.x = true;
            newX = oppositePoint.x;
          }
        }

        // Y alignment
        if (isAlignedRef.current.y) {
          if (deltaY > ALIGNMENT_THRESHOLD * 2) {
            isAlignedRef.current.y = false;
          } else {
            newY = oppositePoint.y;
          }
        } else {
          if (deltaY < ALIGNMENT_THRESHOLD) {
            isAlignedRef.current.y = true;
            newY = oppositePoint.y;
          }
        }
      }

      // collision detection and snapping to nodes
      let snappedToNode = false;
      for (const node of allNodes) {
        // prevent snapping to the opposite point's node
        const oppositeNodeId = draggingEnd === "to" ? fromNodeId : toNodeId;
        if (node.id === oppositeNodeId) continue;

        const { x, y } = node.position;
        const { width, height } = node;

        // checks for collision with node bounding box
        if (newX > x && newX < x + width && newY > y && newY < y + height) {
          // snap to nearest side
          const distLeft = Math.abs(newX - x);
          const distRight = Math.abs(newX - (x + width));
          const distTop = Math.abs(newY - y);
          const distBottom = Math.abs(newY - (y + height));

          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          let anchorSide: "top" | "bottom" | "left" | "right" = "top";

          if (minDist === distLeft) {
            anchorSide = "left";
          } else if (minDist === distRight) {
            anchorSide = "right";
          } else if (minDist === distTop) {
            anchorSide = "top";
          } else {
            anchorSide = "bottom";
          }

          if (draggingEnd === "to") {
            updateEdgeHead(edgeId, node.id, { side: anchorSide });
          } else {
            updateEdgeTail(edgeId, node.id, { side: anchorSide });
          }
          snappedToNode = true;
          // clean up
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
    [allNodes, edgeId, fromNodeId, toNodeId, updateEdgeHead, updateEdgeTail, getOppositePoint]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();
    setIsDraggingEdge(false);
    draggingEndRef.current = null;
    // clean up
    isAlignedRef.current = { x: false, y: false };
  }, [setIsDraggingEdge, cleanupListeners]);

  // head endpoint
  const onPointerDownHead = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();

      // check for another pointer
      if (activePointerId.current !== null) {
        return;
      }

      cleanupListeners();
      selectNode(null);

      const currentSelectedId = useFlowStore.getState().selectedEdgeId;
      if (edgeId === currentSelectedId) {
        selectEdge(null);
      } else {
        selectEdge(edgeId);
      }

      let p2: position;

      if (typeof storeEdgeTo === "string") {
        const toNode = nodes.find((n) => n.id === storeEdgeTo);
        if (!toNode) return;
        p2 = getAnchorPoint(toNode, storeEdgeToAnchor);
      } else {
        p2 = storeEdgeTo;
      }

      // get the pointer for tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: p2.x, y: p2.y };
      draggingEndRef.current = "to";
      setIsDraggingEdge(true);

      const onPointerMove = (e: PointerEvent) => {
        // handle the captured pointer
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
    [
      nodes,
      onEnd,
      onMove,
      selectNode,
      setIsDraggingEdge,
      storeEdgeTo,
      storeEdgeToAnchor,
      cleanupListeners,
      selectEdge,
      edgeId,
    ]
  );

  // tail endpoint
  const onPointerDownTail = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();

      // check for another pointer
      if (activePointerId.current !== null) {
        return;
      }

      cleanupListeners();
      selectNode(null);

      const currentSelectedId = useFlowStore.getState().selectedEdgeId;
      if (edgeId === currentSelectedId) {
        selectEdge(null);
      } else {
        selectEdge(edgeId);
      }

      let p1: position;

      if (typeof storeEdgeFrom === "string") {
        const fromNode = nodes.find((n) => n.id === storeEdgeFrom);
        if (!fromNode) return;
        p1 = getAnchorPoint(fromNode, storeEdgeFromAnchor);
      } else {
        p1 = storeEdgeFrom;
      }

      // get the pointer for tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: p1.x, y: p1.y };
      draggingEndRef.current = "from";
      setIsDraggingEdge(true);

      const onPointerMove = (e: PointerEvent) => {
        // handle the captured pointer
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
    [
      nodes,
      onEnd,
      onMove,
      selectNode,
      setIsDraggingEdge,
      storeEdgeFrom,
      storeEdgeFromAnchor,
      cleanupListeners,
      selectEdge,
      edgeId,
    ]
  );

  if (viewMode) {
    return { 
      onPointerDownHead: () => {},
      onPointerDownTail: () => {},
      onEdgeClick: () => {},
    };
  }

  return { 
    onPointerDownHead, 
    onPointerDownTail,
    onEdgeClick,
  };
}