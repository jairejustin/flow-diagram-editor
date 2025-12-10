import type { NodeData, EdgeData, position } from "../../lib/types"
import { useFlowStore } from "../../store/flowStore"
import "./Edge.css"
import { useEdgeDrag } from "../hooks/useEdgeDrag"
import { getAnchorPoint } from "../../lib/utils"

export function Edge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  // Read states from store first
  const storeEdge = useFlowStore((state) => state.edges.find((e) => e.id === edge.id));
  const fromNode = nodes.find(n => n.id === edge.from);

  // Extract values with defaults for the hook
  const storeEdgeTo = storeEdge?.to || { x: 0, y: 0 };
  const storeEdgeToAnchor = storeEdge?.toAnchor || { side: "top" as const };
  const fromNodeId = fromNode?.id || "";

  // Call hook before any early returns
  const { onMouseDown, onTouchStart } = useEdgeDrag(
    edge.id,
    fromNodeId,
    storeEdgeTo,
    storeEdgeToAnchor,
    nodes
  );

  // Safety checks after all hooks
  if (!fromNode || !storeEdge) return null;

  const p1 = getAnchorPoint(fromNode, storeEdge.fromAnchor);

  let p2: position;

  if (typeof storeEdge.to === "string") {
    const toNode = nodes.find(n => n.id === storeEdge.to);
    if (!toNode) return null;

    p2 = getAnchorPoint(toNode, storeEdge.toAnchor);
  } else {
    // storeEdge.to is a raw {x, y} position
    p2 = storeEdge.to;
  }

  const color = storeEdge.style?.color || "black";

  // Calculate label position if label exists
  let labelX = 0;
  let labelY = 0;
  if (storeEdge.label) {
    const t = storeEdge.label.t || 0.5;
    labelX = p1.x + (p2.x - p1.x) * t + (storeEdge.label.offset?.x || 0);
    labelY = p1.y + (p2.y - p1.y) * t + (storeEdge.label.offset?.y || 0);
  }

  return (
    <g>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={storeEdge.style?.width || 2}
        strokeDasharray={storeEdge.style?.dashed ? "5,5" : undefined}
        markerEnd="url(#arrowhead)"
      />
      {storeEdge.label && (
        <g>
          <rect
            x={labelX - 20}
            y={labelY - 10}
            width={40}
            height={20}
            fill="white"
            stroke={color}
            strokeWidth={1}
            rx={3}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={12}
            fontWeight="500"
          >
            {storeEdge.label.text}
          </text>
        </g>
      )}
      {p2 && (
        <circle
          cx={p2.x}
          cy={p2.y}
          r={20}
          fill="transparent"
          style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        />
      )}
    </g>
  );
}