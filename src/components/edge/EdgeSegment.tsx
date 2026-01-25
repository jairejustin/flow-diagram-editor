import { useState, useRef, memo } from "react";
import type { position } from "../../lib/types";
import {
  useUpdateEdgeSegmentPosition,
  useViewport,
} from "../../store/flowStore";

interface EdgeSegmentProps {
  index: number;
  p1: position;
  p2: position;
  prevPoint?: position;
  nextPoint?: position;
  edgeId: string;
  color: string;
  edgeWidth: number;
  isSelected: boolean;
  isLast: boolean;
  onEdgeClick: (e: React.PointerEvent) => void;
}

/**
 * OPTIMIZATION: Render Barrier
 * Why: This component is expensive. It contains event handlers, pointer logic,
 * and math for checking locks/collinearity.
 *
 * Without `memo`, if the parent PolylineEdgeWrapper re-renders (ex. because ONE
 * segment changed), ALL segments would re-execute their logic.
 * `memo` ensures we only re-render the segment that actually moved.
 */
export const EdgeSegment = memo(
  ({
    index,
    p1,
    p2,
    prevPoint,
    nextPoint,
    edgeId,
    color,
    edgeWidth,
    isSelected,
    onEdgeClick,
    isLast,
  }: EdgeSegmentProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const startMousePos = useRef({ x: 0, y: 0 });
    const startSegPos = useRef({ p1: { ...p1 }, p2: { ...p2 } });

    const updateEdgeSegmentPosition = useUpdateEdgeSegmentPosition();
    const viewport = useViewport();
    const zoom = viewport.zoom;

    const isVertical = Math.abs(p1.x - p2.x) < 1;
    const isHorizontal = Math.abs(p1.y - p2.y) < 1;
    const isOrthogonal = isVertical || isHorizontal;

    let isLocked = false;

    if (prevPoint) {
      const isPrevVertical = Math.abs(prevPoint.x - p1.x) < 1;
      const isPrevHorizontal = Math.abs(prevPoint.y - p1.y) < 1;
      if (
        (isVertical && isPrevVertical) ||
        (isHorizontal && isPrevHorizontal)
      ) {
        isLocked = true;
      }
    }

    if (nextPoint) {
      const isNextVertical = Math.abs(p2.x - nextPoint.x) < 1;
      const isNextHorizontal = Math.abs(p2.y - nextPoint.y) < 1;
      if (
        (isVertical && isNextVertical) ||
        (isHorizontal && isNextHorizontal)
      ) {
        isLocked = true;
      }
    }

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
          strokeDasharray={isLast ? `${dashLength} ${totalLength}` : "none"}
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
);