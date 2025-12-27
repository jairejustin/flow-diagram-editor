import { useRef } from "react";
import type { NodeData } from "../../lib/types";
import { wrapText } from "../../lib/utils";
import "./Node.css";
import { useNode } from "../../hooks/useNode";

interface NodeProps {
  node: NodeData;
}

export const Node = ({ node }: NodeProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    storeNode,
    position,
    height,
    width,
    text,
    pad,
    onPointerDown
  } = useNode(node);

  if (!storeNode) return null;


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
      onPointerDown={onPointerDown}
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
      
    case "ellipse":
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );
      
    case "parallelogram": {
      const offset = width * 0.2;
      return (
        <polygon
          points={`${offset},0 ${width},0 ${width - offset},${height} 0,${height}`}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );
    }
      
    case "trapezoid": {
      const topOffset = width * 0.2;
      return (
        <polygon
          points={`${topOffset},0 ${width - topOffset},0 ${width},${height} 0,${height}`}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );
    }
      
    case "document": {
      const curveHeight = height * 0.1;
      return (
        <path
          d={`
            M 0,0
            L ${width},0
            L ${width},${height - curveHeight}
            Q ${width * 0.75},${height} ${width / 2},${height - curveHeight}
            Q ${width * 0.25},${height - curveHeight * 2} 0,${height - curveHeight}
            Z
          `}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );
    }
      
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