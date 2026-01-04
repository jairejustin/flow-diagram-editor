import type { NodeData, EdgeData } from "../../lib/types"
import "./Edge.css"
import { useEdgeDrag } from "../../hooks/edge-hooks/useEdgeDrag"
import { useStraightEdge } from "../../hooks/edge-hooks/useStraightEdge"

export function Edge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  const { 
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
    arrowheadDimensions
  } = useStraightEdge(edge, nodes);

  const { onPointerDownHead, onPointerDownTail, onEdgeClick } = useEdgeDrag(
    edge.id,
    fromNodeId,
    toNodeId,
    to,
    toAnchor,
    from,
    fromAnchor,
    nodes
  );

  if (!storeEdge || !p1 || !p2) {
    return null;
  }

  return (
    <g>
      <defs>
        <marker
          id={`arrowhead-${edge.id}`}
          markerWidth={arrowheadDimensions.width}
          markerHeight={arrowheadDimensions.height}
          refX={arrowheadDimensions.refX}
          refY={arrowheadDimensions.refY}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points={`0,0 ${arrowheadDimensions.width},${arrowheadDimensions.height / 2} 0,${arrowheadDimensions.height}`}
            fill={color}
          />
        </marker>
      </defs>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={edgeWidth}
        strokeDasharray={`${(Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)) - edgeWidth} ${edgeWidth}`}
        strokeLinecap="round"
        markerEnd={`url(#arrowhead-${edge.id})`}
        style={{ 
          cursor: "pointer", 
          pointerEvents: "auto",
          opacity: isSelected ? 1 : 0.8
        }}
      />
      <line
        x1={p1.x} 
        y1={p1.y} 
        x2={p2.x} 
        y2={p2.y}
        stroke="transparent"
        strokeWidth={Math.max(20, edgeWidth + 16)}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        onPointerDown={onEdgeClick}
      />
      {isSelected && (
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={color}
          strokeWidth={edgeWidth + 4}
          opacity={0.2}
          pointerEvents="none"
        />
      )}
      {storeEdge.label && (
        <g>
          <rect
            x={labelX - labelWidth / 2}
            y={labelY - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
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
            fontSize={labelFontSize}
            fontWeight="500"
          >
            {storeEdge.label.text}
          </text>
        </g>
      )}
      <circle
        className="hover-indicator"
        cx={p2.x}
        cy={p2.y}
        r={25}
        fill="transparent"
        style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownHead}
      />
      <circle
        className="hover-indicator"
        cx={p1.x}
        cy={p1.y}
        r={25}
        fill="transparent"
        style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownTail}
      />
    </g>
  );
}