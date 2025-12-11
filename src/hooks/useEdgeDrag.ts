import { useRef, useCallback, useEffect } from "react";
import type { NodeData, EdgeAnchor, position } from "../lib/types";
import { useFlowStore } from "../store/flowStore";
import { getAnchorPoint } from "../lib/utils";


export function useEdgeDrag(
  edgeId: string,
  fromNodeId: string,
  storeEdgeTo: string | position,
  storeEdgeToAnchor: EdgeAnchor,
  nodes: NodeData[]
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

  const allNodes = useFlowStore((state) => state.nodes);
  const updateEdgeHead = useFlowStore((state) => state.updateEdgeHead);
  const setIsDraggingEdge = useFlowStore((state) => state.setIsDraggingEdge);
  const selectNode = useFlowStore((state) => state.selectNode);

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

      const newX = startPosRef.current.x + dx;
      const newY = startPosRef.current.y + dy;

      // Collision detection and snapping
      let snappedToNode = false;
      for (const node of allNodes) {
        if (node.id === fromNodeId) continue; // Don't snap to the source node
        const { x, y } = node.position;
        const { width, height } = node;

        // Check for collision with node bounding box
        if (newX > x && newX < x + width && newY > y && newY < y + height) {
          // Collision detected, snap to nearest side
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
          updateEdgeHead(edgeId, node.id, { side: anchorSide });
          snappedToNode = true;
          break;
        }
      }

      if (!snappedToNode) {
        updateEdgeHead(edgeId, { x: newX, y: newY });
      }
    },
    [allNodes, edgeId, fromNodeId, updateEdgeHead]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();
    setIsDraggingEdge(false);
  }, [setIsDraggingEdge, cleanupListeners]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      cleanupListeners();
      e.stopPropagation();
      selectNode(null);

      let p2: position;

      if (typeof storeEdgeTo === "string") {
        const toNode = nodes.find((n) => n.id === storeEdgeTo);
        if (!toNode) return;
        p2 = getAnchorPoint(toNode, storeEdgeToAnchor);
      } else {
        p2 = storeEdgeTo;
      }

      mousePosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: p2.x, y: p2.y };
      setIsDraggingEdge(true);

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
    [nodes, onEnd, onMove, selectNode, setIsDraggingEdge, storeEdgeTo, storeEdgeToAnchor, cleanupListeners]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      cleanupListeners();
      e.stopPropagation();

      let p2: position;

      if (typeof storeEdgeTo === "string") {
        const toNode = nodes.find((n) => n.id === storeEdgeTo);
        if (!toNode) return;
        p2 = getAnchorPoint(toNode, storeEdgeToAnchor);
      } else {
        p2 = storeEdgeTo;
      }

      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { x: p2.x, y: p2.y };
      setIsDraggingEdge(true);

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        selectNode(null);
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
    [nodes, onEnd, onMove, setIsDraggingEdge, storeEdgeTo, storeEdgeToAnchor, cleanupListeners, selectNode]
  );

  return { onMouseDown, onTouchStart };
}