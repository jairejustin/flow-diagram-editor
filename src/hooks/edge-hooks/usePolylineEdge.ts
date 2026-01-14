import type { NodeData, EdgeData, position, EdgeAnchor } from "../../lib/types";
import { useFlowStore } from "../../store/flowStore";
import { getAnchorPoint, getArrowheadDimensions } from "../../lib/utils";

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

export function usePolylineEdge(
  edge: EdgeData,
  nodes: NodeData[]
): UsePolylineEdgeResult {
  const storeEdge = useFlowStore((state) =>
    state.edges.find((e) => e.id === edge.id)
  );
  const selectedEdgeId = useFlowStore((state) => state.selectedEdgeId);

  const edgeWidth: number = storeEdge?.style?.width || 2;
  const arrowheadDimensions = getArrowheadDimensions(edgeWidth);

  // Defaults
  let color: string = "black";
  let isSelected: boolean = false;
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

  // resolve start point (anchor or coordinate)
  let pStart: position | null = null;
  if (typeof storeEdge.from === "string") {
    const fromNode = nodes.find((n) => n.id === storeEdge.from);
    if (fromNode) {
      fromNodeId = fromNode.id;
      pStart = getAnchorPoint(fromNode, storeEdge.fromAnchor);
    }
  } else {
    pStart = storeEdge.from;
  }
  from = storeEdge.from;
  fromAnchor = storeEdge.fromAnchor || { side: "bottom" };

  // resolve end point (anchor or coordinate)
  let pEnd: position | null = null;
  if (typeof storeEdge.to === "string") {
    const toNode = nodes.find((n) => n.id === storeEdge.to);
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
  // [AnchorStart, ...StoredPoints, AnchorEnd]
  const allPoints: position[] = [];

  if (pStart && pEnd) {
    allPoints.push(pStart);
    if (storeEdge.points && storeEdge.points.length > 0) {
      allPoints.push(...storeEdge.points);
    } else {
      // NOTE: If no points exist for an Elbow edge, we could calculate a default path here.
      // For now, we just connect start to end (behaving like straight until points are added).
      // A more advanced implementation would auto-calculate orthogonal points here.
    }
    allPoints.push(pEnd);
  }

  // styles & selection
  color = storeEdge.style?.color || "black";
  isSelected = selectedEdgeId === edge.id;

  // Label Positioning
  // for polyline, we usually place label on the middle segment or the longest segment.
  // here we assume the middle of the path.
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

    // find the segment containing the midpoint
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
