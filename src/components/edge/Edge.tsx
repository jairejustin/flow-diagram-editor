import type { NodeData, EdgeData } from "../../lib/types"
import "./Edge.css"
import { useEdgeDrag } from "../../hooks/useEdgeDrag"
import { useStraightEdge } from "../../hooks/useStraightEdge"

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
    fromAnchor
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
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill={color}/>
        </marker>
      </defs>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={storeEdge.style?.width || 2}
        strokeDasharray={storeEdge.style?.dashed ? "5,5" : undefined}
        onPointerDown={onEdgeClick}
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
        strokeWidth={Math.max(20, (storeEdge.style?.width || 2) + 16)}
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
          strokeWidth={(storeEdge.style?.width || 2) + 4}
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