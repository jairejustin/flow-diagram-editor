import { useRef } from "react";
import type { NodeData } from "../../lib/types";
import { wrapText } from "../../lib/utils";
import { useFlowStore } from "../../store/flowStore";
import "./Node.css";
import { useNodeDrag } from "../../hooks/useNodeDrag";

interface NodeProps {
  node: NodeData;
}

export const Node = ({ node }: NodeProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  //states from store
  const storeNode = useFlowStore((state) => state.nodes.find((n) => n.id === node.id));
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);

  //extraction with defaults
  const position = storeNode?.position || { x: 0, y: 0 };
  const height = storeNode?.height || 100;
  const width = storeNode?.width || 150;
  const editing = storeNode?.editing || false;
  const text = storeNode?.content || "";

  //drag hook
  const { onMouseDown, onTouchStart } = useNodeDrag(node.id, position, editing);

  //check
  if (!storeNode) {
    console.error(`Node ${node.id} not found in store`);
    return null;
  }

  //style offsets
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