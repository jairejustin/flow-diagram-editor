import { useRef, useCallback, useEffect } from "react";
import { useFlowStore } from "../store/flowStore";
import { getAnchorPoint } from "../lib/utils";
import type { position, EdgeAnchor, NodeData, NodeShape } from "../lib/types";
import { ALIGNMENT_THRESHOLD } from "../lib/constants";

export function useNodeDrag(
  nodeId: string,
  position: { x: number; y: number },
  editing: boolean
) {
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
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

  const selectNode = useCallback(
    (id: string | null) => useFlowStore.setState({ selectedNodeId: id, selectedEdgeId: null }),
    []
  );
  const updateNodePosition = useFlowStore((state) => state.updateNodePosition);
  const setIsDraggingNode = useFlowStore((state) => state.setIsDraggingNode);
  const viewMode = useFlowStore((state) => state.viewMode);
  const allEdges = useFlowStore((state) => state.edges);
  const allNodes = useFlowStore((state) => state.nodes);

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

  // get all connected edge endpoints with their anchor info for alignment
  const getConnectedEndpoints = useCallback(() => {
    const endpoints: Array<{ endpoint: position; myAnchor: EdgeAnchor }> = [];
    
    // get all edges connected to this node
    const connectedEdges = allEdges.filter(
      (edge) => edge.from === nodeId || edge.to === nodeId
    );

    for (const edge of connectedEdges) {
      // get the opposite endpoint and node's anchor
      if (edge.from === nodeId) {
        // this node is the source, get the target endpoint position
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
        // this node is the target, get the source endpoint position
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
      endpointsWithAnchors: Array<{ endpoint: position; myAnchor: EdgeAnchor }>
    ): { x?: number; y?: number } => {
      let bestXDelta = Infinity;
      let bestYDelta = Infinity;
      let alignX: number | undefined;
      let alignY: number | undefined;

      // Get the current node data to calculate anchor points
      const currentNodeData: NodeData = {
        position: newNodePos,
        width: nodeWidth,
        height: nodeHeight,
        shape: nodeShape,
        content: "",
        id: nodeId,
      };

      for (const { endpoint, myAnchor } of endpointsWithAnchors) {
        // calculate where this node's anchor point would be at the new position
        const myAnchorPoint = getAnchorPoint(currentNodeData, myAnchor);
        
        const deltaX = Math.abs(myAnchorPoint.x - endpoint.x);
        const deltaY = Math.abs(myAnchorPoint.y - endpoint.y);

        // find closest X alignment within threshold
        if (deltaX < ALIGNMENT_THRESHOLD && deltaX < bestXDelta) {
          bestXDelta = deltaX;
          // calculate what the node position should be to align this anchor
          const offsetX = myAnchorPoint.x - newNodePos.x;
          alignX = endpoint.x - offsetX;
        }

        // find closest Y alignment within threshold
        if (deltaY < ALIGNMENT_THRESHOLD && deltaY < bestYDelta) {
          bestYDelta = deltaY;
          // calculate what the node position should be to align this anchor
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
      const dx = (clientX - pointerPosRef.current.x) / useFlowStore.getState().viewport.zoom;
      const dy = (clientY - pointerPosRef.current.y) / useFlowStore.getState().viewport.zoom;

      let newX = startPosRef.current.x + dx;
      let newY = startPosRef.current.y + dy;

      // get the current node's dimensions and shape
      const currentNode = allNodes.find((n) => n.id === nodeId);
      if (!currentNode) return;

      const { width, height, shape } = currentNode;

      // get connected edge endpoints with anchor info for alignment
      const endpointsWithAnchors = getConnectedEndpoints();

      if (endpointsWithAnchors.length > 0) {
        // check X alignment
        if (isAlignedRef.current.x && isAlignedRef.current.targetX !== undefined) {
          const deltaX = Math.abs(newX - isAlignedRef.current.targetX);
          
          if (deltaX > ALIGNMENT_THRESHOLD * 2) {
            // break alignment
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

        // check Y alignment
        if (isAlignedRef.current.y && isAlignedRef.current.targetY !== undefined) {
          const deltaY = Math.abs(newY - isAlignedRef.current.targetY);
          
          if (deltaY > ALIGNMENT_THRESHOLD * 2) {
            // break alignment
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
    [nodeId, updateNodePosition, allNodes, getConnectedEndpoints, findAlignmentTarget]
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
    
    // clean up
    isAlignedRef.current = { x: false, y: false };
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
  
  if (viewMode) {
    return { onPointerDown: () => {} };
  }
  return { onPointerDown };
}