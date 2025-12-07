import { useRef, useCallback } from "react"
import type { NodeData, EdgeData, EdgeAnchor, position } from "../../lib/types"
import { useFlowStore } from "../../store/flowStore"
import "./Edge.css"

function getAnchorPoint(node: NodeData, anchor: EdgeAnchor) {
  const { x, y } = node.position
  const width = node.width
  const height = node.height
  
  switch (anchor.side) {
    case "top":
      return { x: (x + width / 2) + 2, y }
    case "bottom":
      return { x: (x + width / 2) + 2, y: y + height }
    case "left":
      return { x, y: (y + height / 2) + 2 }
    case "right":
      return { x: x + width, y: (y + height / 2) + 2 }
  }
}

export function Edge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {

  const mousePosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  
  const fromNode = nodes.find(n => n.id === edge.from);
  //read states from store
  const storeEdge = useFlowStore((state) => state.edges.find((e) => e.id === edge.id));
  const allNodes = useFlowStore((state) => state.nodes);
  const updateEdgeHead = useFlowStore((state) => state.updateEdgeHead);
  const setIsDraggingEdge = useFlowStore((state) => state.setIsDraggingEdge);
  const selectNode = useFlowStore((state) => state.selectNode)


  if (!fromNode || !storeEdge) return null;

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - mousePosRef.current.x;
      const dy = clientY - mousePosRef.current.y;

      const newX = startPosRef.current.x + dx;
      const newY = startPosRef.current.y + dy;

      // Collision detection and snapping will be implemented here
      let snappedToNode = false;
      for (const node of allNodes) {
        if (node.id === fromNode.id) continue; // Don't snap to the source node
        const { x, y } = node.position;
        const { width, height } = node;

        // Check for collision with node bounding box
        if (newX > x && newX < x + width && newY > y && newY < y + height) {
          // Collision detected, snap to nearest side
          const distLeft = Math.abs(newX - x);
          const distRight = Math.abs(newX - (x + width));
          const distTop = Math.abs(newY - y);
          const distBottom = Math.abs(newY - (y + height));

          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          let anchorSide: "top" | "bottom" | "left" | "right" = "top";

          if (minDist === distLeft) {
            anchorSide = "left";
          } else if (minDist === distRight) {
            anchorSide = "right";
          } else if (minDist === distTop) {
            anchorSide = "top";
          } else {
            anchorSide = "bottom";
          }
          updateEdgeHead(edge.id, node.id, { side: anchorSide });
          snappedToNode = true;
          break;
        }
      }

      if (!snappedToNode) {
        updateEdgeHead(edge.id, { x: newX, y: newY });
      }
    },
    [allNodes, edge.id, fromNode.id, updateEdgeHead]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
    },
    [onMove]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      selectNode(null);
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    [onMove, selectNode]
  );

  const onEnd = useCallback(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onEnd);

    setIsDraggingEdge(false);
  }, [onMouseMove, onTouchMove, setIsDraggingEdge]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(null);

      let p2: position;

      if (typeof storeEdge.to === "string") {
        const toNode = nodes.find((n) => n.id === storeEdge.to);
        if (!toNode) return;
        p2 = getAnchorPoint(toNode, storeEdge.toAnchor);
      } else {
        p2 = storeEdge.to;
      }

      mousePosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: p2.x, y: p2.y };
      setIsDraggingEdge(true);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onEnd);
    },
    [nodes, onEnd, onMouseMove, selectNode, setIsDraggingEdge, storeEdge.to, storeEdge.toAnchor]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();

      let p2: position;

      if (typeof storeEdge.to === "string") {
        const toNode = nodes.find((n) => n.id === storeEdge.to);
        if (!toNode) return;
        p2 = getAnchorPoint(toNode, storeEdge.toAnchor);
      } else {
        p2 = storeEdge.to;
      }

      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { x: p2.x, y: p2.y };
      setIsDraggingEdge(true);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onEnd);
    },
    [nodes, onEnd, onTouchMove, setIsDraggingEdge, storeEdge.to, storeEdge.toAnchor]
  );


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