import { useState, useRef } from "react";
import type { position } from "../../lib/types";
import { useFlowStore } from "../../store/flowStore";

interface EdgeSegmentProps {
  index: number;
  p1: position;
  p2: position;
  // New props to check neighbor orientation
  prevPoint?: position;
  nextPoint?: position;
  edgeId: string;
  color: string;
  edgeWidth: number;
  isSelected: boolean;
  isLast: boolean;
  onEdgeClick: (e: React.PointerEvent) => void;
}

export function EdgeSegment({
  index,
  p1,
  p2,
  prevPoint, // Receive the point before p1
  nextPoint, // Receive the point after p2
  edgeId,
  color,
  edgeWidth,
  isSelected,
  onEdgeClick,
  isLast,
}: EdgeSegmentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startMousePos = useRef({ x: 0, y: 0 });
  const startSegPos = useRef({ p1: { ...p1 }, p2: { ...p2 } });

  const updateEdgeSegmentPosition = useFlowStore(
    (state) => state.updateEdgeSegmentPosition
  );
  const zoom = useFlowStore((state) => state.viewport.zoom);

  // 1. Determine Current Orientation
  const isVertical = Math.abs(p1.x - p2.x) < 1;
  const isHorizontal = Math.abs(p1.y - p2.y) < 1;
  const isOrthogonal = isVertical || isHorizontal;

  // 2. Check Neighbors for Collinearity (The Fix)
  // If the previous segment (prev -> p1) is parallel to current (p1 -> p2), we are collapsed.
  // If the next segment (p2 -> next) is parallel to current, we are also collapsed.

  let isLocked = false;

  if (prevPoint) {
    const isPrevVertical = Math.abs(prevPoint.x - p1.x) < 1;
    const isPrevHorizontal = Math.abs(prevPoint.y - p1.y) < 1;
    if ((isVertical && isPrevVertical) || (isHorizontal && isPrevHorizontal)) {
      isLocked = true;
    }
  }

  if (nextPoint) {
    const isNextVertical = Math.abs(p2.x - nextPoint.x) < 1;
    const isNextHorizontal = Math.abs(p2.y - nextPoint.y) < 1;
    if ((isVertical && isNextVertical) || (isHorizontal && isNextHorizontal)) {
      isLocked = true;
    }
  }

  // Allow drag only if orthogonal, selected, and NOT locked by collinear neighbors
  const canDrag = isOrthogonal && isSelected && !isLocked;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canDrag) {
      onEdgeClick(e);
      return;
    }

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    startMousePos.current = { x: e.clientX, y: e.clientY };
    startSegPos.current = { p1: { ...p1 }, p2: { ...p2 } };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();

    const dx = (e.clientX - startMousePos.current.x) / zoom;
    const dy = (e.clientY - startMousePos.current.y) / zoom;

    if (isVertical) {
      const newX = startSegPos.current.p1.x + dx;
      updateEdgeSegmentPosition(edgeId, index, { axis: "x", value: newX });
    } else {
      const newY = startSegPos.current.p1.y + dy;
      updateEdgeSegmentPosition(edgeId, index, { axis: "y", value: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const cursor = !canDrag
    ? "pointer"
    : isVertical
      ? "col-resize"
      : "row-resize";

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const totalLength = Math.sqrt(dx * dx + dy * dy);

  const dashLength = totalLength > edgeWidth ? totalLength - edgeWidth : 0;

  return (
    <g>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={edgeWidth}
        strokeDasharray={isLast ? `${dashLength} ${totalLength}` : ""}
        strokeLinecap="round"
        style={{ opacity: isSelected ? 1 : 0.8 }}
      />
      {/* Hit Area */}
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="transparent"
        strokeWidth={Math.max(20, edgeWidth + 16)}
        style={{
          cursor: cursor,
          pointerEvents: "auto",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </g>
  );
}
