import React from "react"
import type { NodeData, EdgeData, EdgeAnchor } from "../../lib/types"

function getAnchorPoint(node: NodeData, anchor: EdgeAnchor) {
  const { x, y } = node.position
  const width = node.width
  const height = node.height
  
  switch (anchor.side) {
    case "top":
      return { x: x + width / 2, y }
    case "bottom":
      return { x: x + width / 2, y: y + height }
    case "left":
      return { x, y: y + height / 2 }
    case "right":
      return { x: x + width, y: y + height / 2 }
  }
}

export function Edge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  const fromNode = nodes.find(n => n.id === edge.from);
  if (!fromNode) return null;

  const p1 = getAnchorPoint(fromNode, edge.fromAnchor);

  let p2;
  
  if (typeof edge.to === "string") {
    const toNode = nodes.find(n => n.id === edge.to);
    if (!toNode) return null;

    p2 = getAnchorPoint(toNode, edge.toAnchor);
  } else {
    // edge.to is a raw {x, y} position
    p2 = edge.to; 
  }

  const color = edge.style?.color || "black";

  // Calculate label position if label exists
  let labelX = 0;
  let labelY = 0;
  if (edge.label) {
    const t = edge.label.t || 0.5;
    labelX = p1.x + (p2.x - p1.x) * t + (edge.label.offset?.x || 0);
    labelY = p1.y + (p2.y - p1.y) * t + (edge.label.offset?.y || 0);
  }

  return (
    <g>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={edge.style?.width || 2}
        strokeDasharray={edge.style?.dashed ? "5,5" : undefined}
        markerEnd="url(#arrowhead)"
      />
      {edge.label && (
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
            {edge.label.text}
          </text>
        </g>
      )}
    </g>
  );
}