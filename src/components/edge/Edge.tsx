import type { NodeData, EdgeData, position, EdgeAnchor } from "../../lib/types"
import { useFlowStore } from "../../store/flowStore"
import "./Edge.css"
import { useEdgeDrag } from "../../hooks/useEdgeDrag"
import { getAnchorPoint } from "../../lib/utils"
import { useCallback } from "react"

export function Edge({ edge, nodes }: { edge: EdgeData; nodes: NodeData[] }) {
  const storeEdge = useFlowStore((state) => state.edges.find((e) => e.id === edge.id));
  const selectedEdgeId = useFlowStore((state) => state.selectedEdgeId);
  const selectNode = useFlowStore((state) => state.selectNode);

  // initialize variables for hooks with defaults to ensure unconditional hook calls
  let fromNodeIdForHook: string = "";
  let toNodeIdForHook: string | undefined = undefined;
  let storeEdgeToForHook: EdgeData['to'] = { x: 0, y: 0 }; 
  let storeEdgeFromForHook: EdgeData['from'] = { x: 0, y: 0 };
  let storeEdgeToAnchorForHook: EdgeAnchor = { side: "top" as const };
  let storeEdgeFromAnchorForHook: EdgeAnchor = { side: "bottom" as const };

  // define fromNode here to be accessible later in the component and for conditional logic
  let fromNode: NodeData | undefined;

  // get values for hooks if storeEdge exists
  if (storeEdge) {
    if (typeof storeEdge.from === "string") {
      fromNode = nodes.find(n => n.id === storeEdge.from);
      fromNodeIdForHook = fromNode?.id || "";
    }
    storeEdgeToForHook = storeEdge.to;
    storeEdgeToAnchorForHook = storeEdge.toAnchor || { side: "top" as const };
    storeEdgeFromForHook = storeEdge.from;
    storeEdgeFromAnchorForHook = storeEdge.fromAnchor || { side: "bottom" as const };
    toNodeIdForHook = typeof storeEdge.to === "string" ? storeEdge.to : undefined;
  }

  const { onPointerDownHead, onPointerDownTail } = useEdgeDrag(
    edge.id,
    fromNodeIdForHook,
    toNodeIdForHook,
    storeEdgeToForHook,
    storeEdgeToAnchorForHook,
    storeEdgeFromForHook,
    storeEdgeFromAnchorForHook,
    nodes
  );

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(null);
      
      if (selectedEdgeId === edge.id) {
        useFlowStore.setState({ selectedEdgeId: null });
      } else {
        useFlowStore.setState({ selectedEdgeId: edge.id });
      }
    },
    [edge.id, selectedEdgeId, selectNode]
  );
  
  // safety check
  if (!storeEdge) return null;

  // conditional logic will safely proceed since storeEdge is guaranteed to exist
  // rechecking fromNode in case it was not found earlier when storeEdge.from was a string
  if (typeof storeEdge.from === "string") {
    // If from is a string but node not found, edge is invalid
    if (!fromNode) return null;
  }
  // if from is a position object, fromNode stays undefined

  // calculate p1, handle both node and position
  let p1: position;
  if (typeof storeEdge.from === "string" && fromNode) {
    p1 = getAnchorPoint(fromNode, storeEdge.fromAnchor);
  } else if (typeof storeEdge.from === "object") {
    p1 = storeEdge.from; // It's already a position
  } else {
    return null; // Invalid state
  }
  
  // calculate p2, handle both node and position
  let p2: position;
  if (typeof storeEdge.to === "string") {
    const toNode = nodes.find(n => n.id === storeEdge.to);
    if (!toNode) return null;
    p2 = getAnchorPoint(toNode, storeEdge.toAnchor);
  } else {
    p2 = storeEdge.to; // already a position
  }
  
  const color = storeEdge.style?.color || "black";
  const isSelected = selectedEdgeId === edge.id;
  
  // get label position if label exists
  let labelX = 0;
  let labelY = 0;
  if (storeEdge.label) {
    const t = storeEdge.label.t || 0.5;
    labelX = p1.x + (p2.x - p1.x) * t + (storeEdge.label.offset?.x || 0);
    labelY = p1.y + (p2.y - p1.y) * t + (storeEdge.label.offset?.y || 0);
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
        onMouseDown={handleEdgeClick}
        markerEnd={`url(#arrowhead-${edge.id})`}
        style={{ 
          cursor: "pointer", 
          pointerEvents: "auto",
          opacity: isSelected ? 1 : 0.8
        }}
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
      
      {/* to endpoint */}
      <circle
        className="hover-indicator"
        cx={p2.x}
        cy={p2.y}
        r={20}
        fill="transparent"
        style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownHead}
      />
      
      {/* from endpoint */}
      <circle
        className="hover-indicator"
        cx={p1.x}
        cy={p1.y}
        r={20}
        fill="transparent"
        style={{ cursor: "grab", touchAction: "none", pointerEvents: "auto" }}
        onPointerDown={onPointerDownTail}
      />
    </g>
  );
}