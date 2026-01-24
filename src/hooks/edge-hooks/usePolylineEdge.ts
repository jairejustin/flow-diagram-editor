import type { NodeData, EdgeData, position, EdgeAnchor } from "../../lib/types";
import {
  useSelectedEdgeId,
  useEdgeById,
  useDragState,
  useNodeById,
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

// get effective node (persistent or transient)
const getEffectiveNode = (
  node: NodeData | undefined,
  nodeId: string | undefined,
  dragState: ReturnType<typeof useDragState>
): NodeData | undefined => {
  if (node && dragState.nodeId === nodeId && dragState.position) {
    return { ...node, position: dragState.position };
  }
  return node;
};

export function usePolylineEdge(edge: EdgeData): UsePolylineEdgeResult {
  const storeEdge = useEdgeById(edge.id);
  const selectedEdgeId = useSelectedEdgeId();
  const dragState = useDragState();
  const isSelected = selectedEdgeId === edge.id;

  // resolve node IDs first
  const fromIdStr =
    storeEdge && typeof storeEdge.from === "string"
      ? storeEdge.from
      : undefined;
  const toIdStr =
    storeEdge && typeof storeEdge.to === "string" ? storeEdge.to : undefined;

  const fromNodeRaw = useNodeById(fromIdStr || null);
  const toNodeRaw = useNodeById(toIdStr || null);

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
  const fromNode = getEffectiveNode(fromNodeRaw, fromIdStr, dragState);
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
  const toNode = getEffectiveNode(toNodeRaw, toIdStr, dragState);
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

    // dynamic routing: recalculate path on an elbow edge
    if (storeEdge.path === "elbow") {
      // Note: createElbowPath returns [startStub, ...corners, endStub]
      // We already pushed pStart (the anchor).
      // Ideally, createElbowPath should be used fully to replace the path.

      // If we use createElbowPath, it gives us the full path including stubs.
      // We should use that, but we need to verify start/end match anchor points exactly.
      // createElbowPath takes (start, end, ...).

      // Clear allPoints and reuse dynamicPoints
      // But we need to be careful if createElbowPath behavior changes.
      // For now, let's append the dynamic points (excluding the start/end if they duplicate).

      // simplest robust way:
      const pathPoints = createElbowPath(
        pStart,
        pEnd,
        fromAnchor.side,
        toAnchor.side
      );
      // pathPoints[0] is startStub. pStart is anchor.
      // We'll keep pStart, then pathPoints, then pEnd.
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
