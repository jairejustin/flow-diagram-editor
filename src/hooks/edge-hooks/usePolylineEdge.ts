import { useCallback } from "react";
import type { NodeData, EdgeData, position, EdgeAnchor } from "../../lib/types";
import {
  useSelectedEdgeId,
  useEdgeById,
  useNodeById,
  useFlowStore,
} from "../../store/flowStore";
import {
  getAnchorPoint,
  getArrowheadDimensions,
  createElbowPath,
} from "../../lib/utils";

interface UsePolylineEdgeResult {
  points: position[];
  color: string;
  isSelected: boolean;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelWidth: number;
  labelHeight: number;
  storeEdge: EdgeData | undefined;
  fromNodeId: string;
  toNodeId: string | undefined;
  to: EdgeData["to"];
  from: EdgeData["from"];
  toAnchor: EdgeAnchor;
  fromAnchor: EdgeAnchor;
  edgeWidth: number;
  arrowheadDimensions: {
    width: number;
    height: number;
    refX: number;
    refY: number;
  };
}

export function usePolylineEdge(edge: EdgeData): UsePolylineEdgeResult {
  const storeEdge = useEdgeById(edge.id);
  const selectedEdgeId = useSelectedEdgeId();
  const isSelected = selectedEdgeId === edge.id;

  // resolve node IDs first
  const fromIdStr =
    storeEdge && typeof storeEdge.from === "string"
      ? storeEdge.from
      : undefined;
  const toIdStr =
    storeEdge && typeof storeEdge.to === "string" ? storeEdge.to : undefined;

  /**
   * PERFORMANCE CRITICAL: Granular Subscription
   * Why: Standard `useDragState()` triggers a re-render for EVERY edge on EVERY frame
   * whenever any node is dragged. By using this selector, we ensure this specific hook
   * only wakes up if the dragged node is actually connected to THIS edge.
   */
  const relevantDragPos = useFlowStore(
    useCallback(
      (state) => {
        const { nodeId, position } = state.dragState;

        // fast exit if no drag is happening
        if (!nodeId || !position) return null;

        // Why: Filter out noise. If the moving node isn't one of our endpoints,
        // we don't care about the update.
        if (nodeId === fromIdStr || nodeId === toIdStr) {
          /**
           * STABILITY FIX: Return the Store Object Reference
           * Why: React's useSyncExternalStore (underlying Zustand) compares the
           * result of this selector using Object.is().
           * If we returned a new object literal like { nodeId, position }, it would
           * be a new reference every time, causing an infinite loop or "Snapshot" error.
           * Returning `state.dragState` guarantees referential stability.
           */
          return state.dragState;
        }
        return null;
      },
      [fromIdStr, toIdStr]
    )
  );

  const fromNodeRaw = useNodeById(fromIdStr || null);
  const toNodeRaw = useNodeById(toIdStr || null);

  /**
   * PERFORMANCE FIX: Transient Updates
   * Why: We override the node's position with the drag state locally within this render.
   * This allows the edge to follow the mouse instantly without waiting for
   * the expensive operation of updating the actual Node object in the global store.
   */
  const getEffectiveNode = (
    node: NodeData | undefined,
    nodeId: string | undefined
  ): NodeData | undefined => {
    if (
      node &&
      relevantDragPos &&
      relevantDragPos.nodeId === nodeId &&
      relevantDragPos.position
    ) {
      return { ...node, position: relevantDragPos.position };
    }
    return node;
  };

  const edgeWidth: number = storeEdge?.style?.width || 2;
  const arrowheadDimensions = getArrowheadDimensions(edgeWidth);

  // defaults
  let color: string = "black";
  let labelX: number = 0;
  let labelY: number = 0;
  let labelFontSize: number = 14;
  let labelWidth: number = 40;
  let labelHeight: number = 20;

  // Connection Data
  let fromNodeId: string = "";
  let toNodeId: string | undefined = undefined;
  let to: EdgeData["to"] = { x: 0, y: 0 };
  let from: EdgeData["from"] = { x: 0, y: 0 };
  let toAnchor: EdgeAnchor = { side: "top" as const };
  let fromAnchor: EdgeAnchor = { side: "bottom" as const };

  if (!storeEdge) {
    return {
      points: [],
      color,
      isSelected,
      labelX,
      labelY,
      labelFontSize,
      labelWidth,
      labelHeight,
      storeEdge,
      fromNodeId,
      toNodeId,
      to,
      from,
      toAnchor,
      fromAnchor,
      edgeWidth,
      arrowheadDimensions,
    };
  }

  // resolve Start Node
  const fromNode = getEffectiveNode(fromNodeRaw, fromIdStr);
  let pStart: position | null = null;

  if (typeof storeEdge.from === "string") {
    if (fromNode) {
      fromNodeId = fromNode.id;
      pStart = getAnchorPoint(fromNode, storeEdge.fromAnchor);
    }
  } else {
    pStart = storeEdge.from;
  }
  from = storeEdge.from;
  fromAnchor = storeEdge.fromAnchor || { side: "bottom" };

  // resolve End Node
  const toNode = getEffectiveNode(toNodeRaw, toIdStr);
  let pEnd: position | null = null;

  if (typeof storeEdge.to === "string") {
    if (toNode) {
      toNodeId = toNode.id;
      pEnd = getAnchorPoint(toNode, storeEdge.toAnchor);
    }
  } else {
    pEnd = storeEdge.to;
  }
  to = storeEdge.to;
  toAnchor = storeEdge.toAnchor || { side: "top" };

  // construct points array
  const allPoints: position[] = [];

  if (pStart && pEnd) {
    allPoints.push(pStart);

    if (storeEdge.path === "elbow") {
      const pathPoints = createElbowPath(
        pStart,
        pEnd,
        fromAnchor.side,
        toAnchor.side
      );
      allPoints.push(...pathPoints);
    } else if (storeEdge.points && storeEdge.points.length > 0) {
      allPoints.push(...storeEdge.points);
    }

    allPoints.push(pEnd);
  }

  // styles & selection
  color = storeEdge.style?.color || "black";

  // label positioning
  if (allPoints.length >= 2 && storeEdge.label) {
    const totalLength = allPoints.reduce((acc, p, i) => {
      if (i === 0) return 0;
      const prev = allPoints[i - 1];
      return (
        acc + Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2))
      );
    }, 0);

    let currentLen = 0;
    const midLen = totalLength * (storeEdge.label.t || 0.5);

    for (let i = 0; i < allPoints.length - 1; i++) {
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];
      const segLen = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );

      if (currentLen + segLen >= midLen) {
        const tInSeg = (midLen - currentLen) / segLen;
        labelX = p1.x + (p2.x - p1.x) * tInSeg;
        labelY = p1.y + (p2.y - p1.y) * tInSeg;
        break;
      }
      currentLen += segLen;
    }

    labelFontSize = storeEdge.label.fontSize || 14;
    const textLength = storeEdge.label.text.length;
    const charWidth = labelFontSize * 0.6;
    labelWidth = Math.max(
      textLength * charWidth + labelFontSize * 1.6,
      labelFontSize * 2
    );
    labelHeight = labelFontSize + labelFontSize * 0.8;
  }

  return {
    points: allPoints,
    color,
    isSelected,
    labelX,
    labelY,
    labelFontSize,
    labelWidth,
    labelHeight,
    storeEdge,
    fromNodeId,
    toNodeId,
    to,
    from,
    toAnchor,
    fromAnchor,
    edgeWidth,
    arrowheadDimensions,
  };
}
