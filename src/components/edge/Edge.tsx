import { memo } from "react";
import type { EdgeData } from "../../lib/types";
import "./Edge.css";
import { useEdgeDrag } from "../../hooks/edge-hooks/useEdgeDrag";
import { useStraightEdge } from "../../hooks/edge-hooks/useStraightEdge";
import { usePolylineEdge } from "../../hooks/edge-hooks/usePolylineEdge";
import { EdgeSegment } from "./EdgeSegment";
import { useEdgeById } from "../../store/flowStore";

interface EdgeProps {
  id: string;
}

const PolylineEdgeWrapper = memo(({ edge }: { edge: EdgeData }) => {
  const {
    points,
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
  } = usePolylineEdge(edge);

  const { onPointerDownHead, onPointerDownTail, onEdgeClick } = useEdgeDrag(
    edge.id,
    fromNodeId,
    toNodeId,
    to,
    toAnchor,
    from,
    fromAnchor
  );

  if (!storeEdge || points.length < 2) return null;

  const pStart = points[0];
  const pEnd = points[points.length - 1];

  return (
    <g>
      <defs>
        <linearGradient
          id={`gradient-${edge.id}`}
          gradientUnits="userSpaceOnUse"
          x1={pStart.x}
          y1={pStart.y}
          x2={pEnd.x}
          y2={pEnd.y}
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={0.1} />
        </linearGradient>

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
            points={`0,0 ${arrowheadDimensions.width},${
              arrowheadDimensions.height / 2
            } 0,${arrowheadDimensions.height}`}
            fill={color}
          />
        </marker>
      </defs>

      {/* Selection Highlight */}
      {isSelected && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={`url(#gradient-${edge.id})`}
          strokeWidth={edgeWidth + 8}
          strokeLinecap="round"
          strokeOpacity={0.5}
          pointerEvents="none"
        />
      )}

      {/* RENDER SEGMENTS */}
      {points.map((p1, i) => {
        if (i === points.length - 1) return null;
        const p2 = points[i + 1];
        const prevPoint = i > 0 ? points[i - 1] : undefined;
        const nextPoint = i < points.length - 2 ? points[i + 2] : undefined;
        const storeIndex = i - 1;
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
            isLast={i === points.length - 2}
          />
        );
      })}

      <line
        x1={points[points.length - 2].x}
        y1={points[points.length - 2].y}
        x2={points[points.length - 1].x}
        y2={points[points.length - 1].y}
        stroke="transparent"
        markerEnd={`url(#arrowhead-${edge.id})`}
        pointerEvents="none"
      />

      {/* Labels */}
      {storeEdge.label && (
        <g style={{ pointerEvents: "none" }}>
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
      <circle
        className="hover-indicator"
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={25}
        fill="transparent"
        style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownHead}
      />
      <circle
        className="hover-indicator"
        cx={points[0].x}
        cy={points[0].y}
        r={25}
        fill="transparent"
        style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownTail}
      />
    </g>
  );
});

const StraightEdgeWrapper = memo(({ edge }: { edge: EdgeData }) => {
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
    arrowheadDimensions,
  } = useStraightEdge(edge);

  const { onPointerDownHead, onPointerDownTail, onEdgeClick } = useEdgeDrag(
    edge.id,
    fromNodeId,
    toNodeId,
    to,
    toAnchor,
    from,
    fromAnchor
  );

  if (!storeEdge || !p1 || !p2) return null;

  return (
    <g>
      <defs>
        <linearGradient
          id={`gradient-${edge.id}`}
          gradientUnits="userSpaceOnUse"
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={0.1} />
        </linearGradient>

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
            points={`0,0 ${arrowheadDimensions.width},${
              arrowheadDimensions.height / 2
            } 0,${arrowheadDimensions.height}`}
            fill={color}
          />
        </marker>
      </defs>

      {/* Selection Highlight (Gradient Glow) */}
      {isSelected && (
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={`url(#gradient-${edge.id})`}
          strokeWidth={edgeWidth + 8}
          strokeOpacity={0.5}
          pointerEvents="none"
        />
      )}

      {/* Visible Line */}
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={edgeWidth}
        strokeDasharray={`${
          Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) - edgeWidth
        } ${edgeWidth}`}
        strokeLinecap="round"
        markerEnd={`url(#arrowhead-${edge.id})`}
        style={{
          cursor: "pointer",
          pointerEvents: "auto",
          opacity: isSelected ? 1 : 0.8,
        }}
      />

      {/* Click Hit Area */}
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

      {/* Labels */}
      {storeEdge.label && (
        <g style={{ pointerEvents: "none" }}>
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
});

export const Edge = memo(({ id }: EdgeProps) => {
  const edge = useEdgeById(id);
  if (!edge) return null;

  if (edge.path === "elbow") {
    return <PolylineEdgeWrapper edge={edge} />;
  }
  return <StraightEdgeWrapper edge={edge} />;
});
