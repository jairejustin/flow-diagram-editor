import { useRef, useCallback, useEffect } from "react";
import {
  useEdges,
  useNodes,
  useSelectedNodeId,
  useSelectNode,
  useSetIsDraggingNode,
  useUpdateNodePosition,
  useViewMode,
  useViewport,
} from "../../store/flowStore";
import { getAnchorPoint } from "../../lib/utils";
import type {
  position,
  NodeData,
  NodeShape,
  AlignmentCandidate,
} from "../../lib/types";
import { ALIGNMENT_THRESHOLD, PAN_LIMIT } from "../../lib/constants";

export function useNodeDrag(
  nodeId: string,
  position: { x: number; y: number },
) {
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const alignmentCandidatesRef = useRef<AlignmentCandidate[]>([]);

  const isAlignedRef = useRef<{
    x: boolean;
    y: boolean;
    targetX?: number;
    targetY?: number;
  }>({ x: false, y: false });

  const handlersRef = useRef<{
    onPointerMove: ((e: PointerEvent) => void) | null;
    onPointerUp: ((e: PointerEvent) => void) | null;
    onPointerCancel: ((e: PointerEvent) => void) | null;
  }>({
    onPointerMove: null,
    onPointerUp: null,
    onPointerCancel: null,
  });

  const selectNode = useSelectNode();
  const updateNodePosition = useUpdateNodePosition();
  const setIsDraggingNode = useSetIsDraggingNode();
  const viewMode = useViewMode();

  const allEdges = useEdges();
  const allNodes = useNodes();
  const viewport = useViewport();
  const selectedNodeId = useSelectedNodeId();

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
    alignmentCandidatesRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  const calculateConnectedEndpoints = useCallback(() => {
    const endpoints: AlignmentCandidate[] = [];

    const connectedEdges = allEdges.filter(
      (edge) => edge.from === nodeId || edge.to === nodeId
    );

    for (const edge of connectedEdges) {
      if (edge.from === nodeId) {
        let targetPos: position;
        if (typeof edge.to === "string") {
          const toNode = allNodes.find((n) => n.id === edge.to);
          if (toNode) {
            targetPos = getAnchorPoint(toNode, edge.toAnchor);
          } else {
            continue;
          }
        } else {
          targetPos = edge.to;
        }
        endpoints.push({ endpoint: targetPos, myAnchor: edge.fromAnchor });
      } else if (edge.to === nodeId) {
        let sourcePos: position;
        if (typeof edge.from === "string") {
          const fromNode = allNodes.find((n) => n.id === edge.from);
          if (fromNode) {
            sourcePos = getAnchorPoint(fromNode, edge.fromAnchor);
          } else {
            continue;
          }
        } else {
          sourcePos = edge.from;
        }
        endpoints.push({ endpoint: sourcePos, myAnchor: edge.toAnchor });
      }
    }

    return endpoints;
  }, [allEdges, allNodes, nodeId]);

  const findAlignmentTarget = useCallback(
    (
      newNodePos: position,
      nodeWidth: number,
      nodeHeight: number,
      nodeShape: NodeShape,
      candidates: AlignmentCandidate[]
    ): { x?: number; y?: number } => {
      let bestXDelta = Infinity;
      let bestYDelta = Infinity;
      let alignX: number | undefined;
      let alignY: number | undefined;

      const currentNodeData: NodeData = {
        position: newNodePos,
        width: nodeWidth,
        height: nodeHeight,
        shape: nodeShape,
        content: "",
        id: nodeId,
      };

      for (const { endpoint, myAnchor } of candidates) {
        const myAnchorPoint = getAnchorPoint(currentNodeData, myAnchor);

        const deltaX = Math.abs(myAnchorPoint.x - endpoint.x);
        const deltaY = Math.abs(myAnchorPoint.y - endpoint.y);

        if (deltaX < ALIGNMENT_THRESHOLD && deltaX < bestXDelta) {
          bestXDelta = deltaX;
          const offsetX = myAnchorPoint.x - newNodePos.x;
          alignX = endpoint.x - offsetX;
        }

        if (deltaY < ALIGNMENT_THRESHOLD && deltaY < bestYDelta) {
          bestYDelta = deltaY;
          const offsetY = myAnchorPoint.y - newNodePos.y;
          alignY = endpoint.y - offsetY;
        }
      }

      return { x: alignX, y: alignY };
    },
    [nodeId]
  );

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = (clientX - pointerPosRef.current.x) / viewport.zoom;
      const dy = (clientY - pointerPosRef.current.y) / viewport.zoom;

      const currentNode = allNodes.find((n) => n.id === nodeId);
      if (!currentNode) return;

      const { width, height, shape } = currentNode;

      let newX = startPosRef.current.x + dx;
      let newY = startPosRef.current.y + dy;

      // Left Boundary
      if (newX < -PAN_LIMIT) {
        newX = -PAN_LIMIT;
      } else if (newX + width > PAN_LIMIT) {
        newX = PAN_LIMIT - width;
      }

      if (newY > PAN_LIMIT) newY = PAN_LIMIT;
      if (newY < -PAN_LIMIT) newY = -PAN_LIMIT;

      const endpointsWithAnchors = alignmentCandidatesRef.current;

      if (endpointsWithAnchors.length > 0) {
        if (
          isAlignedRef.current.x &&
          isAlignedRef.current.targetX !== undefined
        ) {
          const deltaX = Math.abs(newX - isAlignedRef.current.targetX);
          if (deltaX > ALIGNMENT_THRESHOLD * 2) {
            isAlignedRef.current.x = false;
            isAlignedRef.current.targetX = undefined;
          } else {
            newX = isAlignedRef.current.targetX;
          }
        } else {
          const alignmentTarget = findAlignmentTarget(
            { x: newX, y: newY },
            width,
            height,
            shape,
            endpointsWithAnchors
          );
          if (alignmentTarget.x !== undefined) {
            isAlignedRef.current.x = true;
            isAlignedRef.current.targetX = alignmentTarget.x;
            newX = alignmentTarget.x;
          }
        }

        if (
          isAlignedRef.current.y &&
          isAlignedRef.current.targetY !== undefined
        ) {
          const deltaY = Math.abs(newY - isAlignedRef.current.targetY);
          if (deltaY > ALIGNMENT_THRESHOLD * 2) {
            isAlignedRef.current.y = false;
            isAlignedRef.current.targetY = undefined;
          } else {
            newY = isAlignedRef.current.targetY;
          }
        } else {
          const alignmentTarget = findAlignmentTarget(
            { x: newX, y: newY },
            width,
            height,
            shape,
            endpointsWithAnchors
          );
          if (alignmentTarget.y !== undefined) {
            isAlignedRef.current.y = true;
            isAlignedRef.current.targetY = alignmentTarget.y;
            newY = alignmentTarget.y;
          }
        }
      }

      updateNodePosition(nodeId, { x: newX, y: newY });
    },
    [nodeId, updateNodePosition, allNodes, findAlignmentTarget, viewport]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();
    if (nodeId === selectedNodeId) {
      selectNode(null);
    } else {
      selectNode(nodeId);
    }
    setIsDraggingNode(false);
    isAlignedRef.current = { x: false, y: false };
  }, [nodeId, selectNode, setIsDraggingNode, cleanupListeners, selectedNodeId]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (activePointerId.current !== null) return;

      cleanupListeners();

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: position.x, y: position.y };

      alignmentCandidatesRef.current = calculateConnectedEndpoints();

      setIsDraggingNode(true);

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
      position.x,
      position.y,
      setIsDraggingNode,
      onMove,
      onEnd,
      cleanupListeners,
      calculateConnectedEndpoints,
    ]
  );

  if (viewMode) {
    return { onPointerDown: () => {} };
  }
  return { onPointerDown };
}
