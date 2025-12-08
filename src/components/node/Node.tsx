import { useRef, useCallback, useEffect } from "react";
import type { NodeData } from "../../lib/types";
import { wrapText } from "../../lib/utils";
import { useFlowStore } from "../../store/flowStore";
import "./Node.css";

interface NodeProps {
  node: NodeData;
}

export const Node = ({ node }: NodeProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const handlersRef = useRef<{
    onMouseMove: ((e: MouseEvent) => void) | null;
    onMouseUp: ((e: MouseEvent) => void) | null;
    onTouchMove: ((e: TouchEvent) => void) | null;
    onTouchEnd: ((e: TouchEvent) => void) | null;
  }>({
    onMouseMove: null,
    onMouseUp: null,
    onTouchMove: null,
    onTouchEnd: null,
  });

  //read states from store
  const selectNode = (id: string | null) => useFlowStore.setState({ selectedNodeId: id });
  const storeNode = useFlowStore((state) => state.nodes.find((n) => n.id === node.id));
  const updateNodePosition = useFlowStore((state) => state.updateNodePosition);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const setIsDraggingNode = useFlowStore((state) => state.setIsDraggingNode);
  
  //some safety checks
  if (!storeNode) {
    console.error(`Node ${node.id} not found in store`);
    return null;
  }

  const position = storeNode.position;
  const height = storeNode.height;
  const width = storeNode.width;
  const editing = storeNode.editing || false;
  const text = storeNode.content;

  // Cleanup function
  const cleanupListeners = useCallback(() => {
    if (handlersRef.current.onMouseMove) {
      document.removeEventListener("mousemove", handlersRef.current.onMouseMove);
      handlersRef.current.onMouseMove = null;
    }
    if (handlersRef.current.onMouseUp) {
      document.removeEventListener("mouseup", handlersRef.current.onMouseUp);
      handlersRef.current.onMouseUp = null;
    }
    if (handlersRef.current.onTouchMove) {
      document.removeEventListener("touchmove", handlersRef.current.onTouchMove);
      handlersRef.current.onTouchMove = null;
    }
    if (handlersRef.current.onTouchEnd) {
      document.removeEventListener("touchend", handlersRef.current.onTouchEnd);
      handlersRef.current.onTouchEnd = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - mousePosRef.current.x;
      const dy = clientY - mousePosRef.current.y;

      updateNodePosition(node.id, {
        x: startPosRef.current.x + dx,
        y: startPosRef.current.y + dy,
      });
    },
    [node.id, updateNodePosition]
  );

  const onEnd = useCallback(() => {
    cleanupListeners();
    
    const currentSelectedId = useFlowStore.getState().selectedNodeId;
    if (node.id === currentSelectedId) {
      selectNode(null);
    } else {
      selectNode(node.id);
    }

    setIsDraggingNode(false);
  }, [node.id, selectNode, setIsDraggingNode, cleanupListeners]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editing) return;

      // Clean up any existing listeners first
      cleanupListeners();

      mousePosRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { x: position.x, y: position.y };
      setIsDraggingNode(true);

      const onMouseMove = (e: MouseEvent) => {
        onMove(e.clientX, e.clientY);
      };

      const onMouseUp = () => {
        onEnd();
      };

      handlersRef.current.onMouseMove = onMouseMove;
      handlersRef.current.onMouseUp = onMouseUp;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [editing, position.x, position.y, setIsDraggingNode, onMove, onEnd, cleanupListeners]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (editing) return;

      // Clean up any existing listeners first
      cleanupListeners();

      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { x: position.x, y: position.y };
      setIsDraggingNode(true);

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      };

      const onTouchEnd = () => {
        onEnd();
      };

      handlersRef.current.onTouchMove = onTouchMove;
      handlersRef.current.onTouchEnd = onTouchEnd;

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [editing, position.x, position.y, setIsDraggingNode, onMove, onEnd, cleanupListeners]
  );

  const border = node.style?.borderWidth || 2;
  const pad = border * 2;

  return (
    <div
      ref={wrapperRef}
      className="node"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: width + pad,
        height: height + pad,
        touchAction: "none"
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={() => updateNodeEditing(node.id, true)}
    >
      <svg
        width={width + pad}
        height={height + pad}
        style={{ overflow: "visible", pointerEvents: "none" }}
      >
        <g transform={`translate(${pad / 2}, ${pad / 2})`}>
          {renderShape(node, width, height)}
          {(() => {
            const fontSize = node.style?.fontSize || 14;
            const wrappedLines = wrapText(text, width - pad, fontSize);
            const lineHeight = fontSize * 1.2;
            const startY = (height / 2) - (wrappedLines.length / 2 - 0.5) * lineHeight;

            return (
              <text
                x={width / 2}
                y={startY}
                dominantBaseline="middle"
                textAnchor="middle"
                fill={node.style?.textColor || "#000"}
                fontSize={fontSize}
                fontWeight={node.style?.fontWeight || "normal"}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {wrappedLines.map((line, index) => (
                  <tspan key={index} x={width / 2} dy={index === 0 ? 0 : lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })()}
        </g>
      </svg>
    </div>
  );
};

function renderShape(node: NodeData, width: number, height: number) {
  const stroke = node.style?.borderWidth || 2;

  switch (node.shape) {
    case "rectangle":
      return (
        <rect
          width={width}
          height={height}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
          rx={node.style?.borderRadius || 0}
        />
      );
    case "diamond":
      return (
        <polygon
          points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );
    // TO DO: more cases for other shapes
    default:
      return (
        <rect
          width={width}
          height={height}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
          rx={node.style?.borderRadius || 0}
        />
      );
  }
}