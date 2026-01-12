import type { NodeData, EdgeData } from "../../lib/types";
import "./Edge.css";
import { useEdgeDrag } from "../../hooks/edge-hooks/useEdgeDrag";
import { useStraightEdge } from "../../hooks/edge-hooks/useStraightEdge";
import { usePolylineEdge } from "../../hooks/edge-hooks/usePolylineEdge";
import { EdgeSegment } from "./EdgeSegment";

function PolylineEdge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  const { 
    points, // [AnchorStart, Stub1, Stub2, ..., AnchorEnd]
    color, isSelected, labelX, labelY, labelFontSize, labelWidth, labelHeight, 
    storeEdge, fromNodeId, toNodeId, to, from, toAnchor, fromAnchor, edgeWidth, arrowheadDimensions
  } = usePolylineEdge(edge, nodes);

  const { onPointerDownHead, onPointerDownTail, onEdgeClick } = useEdgeDrag(
    edge.id, fromNodeId, toNodeId, to, toAnchor, from, fromAnchor, nodes
  );

  if (!storeEdge || points.length < 2) return null;

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

      {/* RENDER SEGMENTS */}
      {points.map((p1, i) => {
        if (i === points.length - 1) return null; 
        const p2 = points[i + 1];
        
        // Pass neighbor points for collinearity checks
        const prevPoint = i > 0 ? points[i - 1] : undefined;
        const nextPoint = i < points.length - 2 ? points[i + 2] : undefined;

        // MAPPING LOGIC:
        // 'points' array includes: [AnchorStart, Stub1, ..., StubN, AnchorEnd]
        // 'store.points' array includes: [Stub1, ..., StubN]
        //
        // Segment 0: AnchorStart -> Stub1. (Not draggable via segment logic)
        // Segment 1: Stub1 -> Stub2. (Corresponds to store index 0)
        // Store Index = Segment Index - 1.
        
        const storeIndex = i - 1;

        // Determine if this is a "docking" segment (connected directly to a node)
        // Docking segments shouldn't slide because they depend on the Anchor position.
        const isDockingSegment = i === 0 || i === points.length - 2;

        return (
          <EdgeSegment
            key={i}
            index={storeIndex}
            p1={p1}
            p2={p2}
            prevPoint={prevPoint}
            nextPoint={nextPoint} 
            edgeId={edge.id}
            color={color}
            edgeWidth={edgeWidth}
            isSelected={isSelected && !isDockingSegment} 
            onEdgeClick={onEdgeClick}
            isLast={i===points.length-2}
          />
        );
      })}

      <line
        x1={points[points.length-2].x} y1={points[points.length-2].y}
        x2={points[points.length-1].x} y2={points[points.length-1].y}
        stroke="transparent"
        markerEnd={`url(#arrowhead-${edge.id})`}
        pointerEvents="none"
      />

      {/* Faint Highlight for Selection Continuity */}
      {isSelected && (
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={edgeWidth + 4}
          opacity={0.1}
          pointerEvents="none"
        />
      )}
       
       {/* Labels */}
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

      {/* Drag Handles */}
       <circle className="hover-indicator" cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={25}
        fill="transparent" style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownHead}
      />
      <circle className="hover-indicator" cx={points[0].x} cy={points[0].y} r={25}
        fill="transparent" style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownTail}
      />
    </g>
  );
}

function StraightEdge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  const { 
    p1, p2, color, isSelected, labelX, labelY, labelFontSize, labelWidth, labelHeight, 
    storeEdge, fromNodeId, toNodeId, to, from, toAnchor, fromAnchor, edgeWidth, arrowheadDimensions
  } = useStraightEdge(edge, nodes);

  const { onPointerDownHead, onPointerDownTail, onEdgeClick } = useEdgeDrag(
    edge.id, fromNodeId, toNodeId, to, toAnchor, from, fromAnchor, nodes
  );

  if (!storeEdge || !p1 || !p2) return null;

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
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
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
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="transparent"
        strokeWidth={Math.max(20, edgeWidth + 16)}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        onPointerDown={onEdgeClick}
      />
      {isSelected && (
        <line
          x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
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
      <circle className="hover-indicator" cx={p2.x} cy={p2.y} r={25}
        fill="transparent" style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownHead}
      />
      <circle className="hover-indicator" cx={p1.x} cy={p1.y} r={25}
        fill="transparent" style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownTail}
      />
    </g>
  );
}

export function Edge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  if (edge.path === "elbow") {
    return <PolylineEdge edge={edge} nodes={nodes} />;
  }
  return <StraightEdge edge={edge} nodes={nodes} />;
}