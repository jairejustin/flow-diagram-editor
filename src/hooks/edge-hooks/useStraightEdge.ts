import type { NodeData, EdgeData, position, EdgeAnchor } from "../../lib/types";
import { useEdgeById, useSelectedEdgeId } from "../../store/flowStore";
import { getAnchorPoint } from "../../lib/utils";
import { getArrowheadDimensions } from "../../lib/utils";

interface UseStraightEdgeResult {
  p1: position | null;
  p2: position | null;
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
  arrowheadDimensions: {
    width: number;
    height: number;
    refX: number;
    refY: number;
  };
  edgeWidth: number;
}

export function useStraightEdge(
  edge: EdgeData,
  nodes: NodeData[]
): UseStraightEdgeResult {
  const storeEdge = useEdgeById(edge.id);
  const selectedEdgeId = useSelectedEdgeId();
  const edgeWidth: number = storeEdge?.style?.width || 2;
  const arrowheadDimensions = getArrowheadDimensions(edgeWidth);

  let p1: position | null = null;
  let p2: position | null = null;
  let color: string = "black";
  let isSelected: boolean = false;
  let labelX: number = 0;
  let labelY: number = 0;
  let labelFontSize: number = 14;
  let labelWidth: number = 40;
  let labelHeight: number = 20;

  let fromNodeId: string = "";
  let toNodeId: string | undefined = undefined;
  let to: EdgeData["to"] = { x: 0, y: 0 };
  let from: EdgeData["from"] = { x: 0, y: 0 };
  let toAnchor: EdgeAnchor = { side: "top" as const };
  let fromAnchor: EdgeAnchor = { side: "bottom" as const };

  if (!storeEdge) {
    return {
      p1,
      p2,
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

  let fromNode: NodeData | undefined;
  if (typeof storeEdge.from === "string") {
    fromNode = nodes.find((n) => n.id === storeEdge.from);
    fromNodeId = fromNode?.id || "";
  }
  to = storeEdge.to;
  toAnchor = storeEdge.toAnchor || { side: "top" as const };
  from = storeEdge.from;
  fromAnchor = storeEdge.fromAnchor || { side: "bottom" as const };
  toNodeId = typeof storeEdge.to === "string" ? storeEdge.to : undefined;

  if (typeof storeEdge.from === "string" && fromNode) {
    p1 = getAnchorPoint(fromNode, storeEdge.fromAnchor);
  } else if (typeof storeEdge.from === "object") {
    p1 = storeEdge.from;
  } else {
    return {
      p1: null,
      p2: null,
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

  if (typeof storeEdge.to === "string") {
    const toNode = nodes.find((n) => n.id === storeEdge.to);
    if (toNode) {
      p2 = getAnchorPoint(toNode, storeEdge.toAnchor);
    } else {
      return {
        p1: null,
        p2: null,
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
  } else {
    p2 = storeEdge.to;
  }

  color = storeEdge.style?.color || "black";
  isSelected = selectedEdgeId === edge.id;

  if (storeEdge.label && p1 && p2) {
    const t = storeEdge.label.t || 0.5;
    labelX = p1.x + (p2.x - p1.x) * t;
    labelY = p1.y + (p2.y - p1.y) * t;
    labelFontSize = storeEdge.label.fontSize || 14;

    const textLength = storeEdge.label.text.length;
    const charWidth = labelFontSize * 0.6;
    const padding = labelFontSize * 0.8;
    const verticalPadding = labelFontSize * 0.4;

    labelWidth = Math.max(
      textLength * charWidth + padding * 2,
      labelFontSize * 2
    );
    labelHeight = labelFontSize + verticalPadding * 2;
  }

  return {
    p1,
    p2,
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
