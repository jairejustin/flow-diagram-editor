import { useRef, useState } from "react";
import type { NodeData } from "../../lib/types";
import { wrapText } from "../../lib/utils";
import "./Node.css";

export const Node = ({ node }: { node: NodeData }) => {
  // TO DO: put these states in zustand global store

  const [position, setPosition] = useState(node.position);
  const [height, setHeight] = useState(node.height);
  const [width, setWidth] = useState(node.width);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(node.content);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  let mousePos = { x: 0, y: 0 };

  const onMove = (clientX: number, clientY: number) => {
    const dx = clientX - mousePos.x;
    const dy = clientY - mousePos.y;
    mousePos = { x: clientX, y: clientY };
    setPosition(pos => ({ x: pos.x + dx, y: pos.y + dy }));
  };

  const onMouseMove = (e: MouseEvent) => {
    onMove(e.clientX, e.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onEnd = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onEnd);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editing) return;
    mousePos = { x: e.clientX, y: e.clientY };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (editing) return;
    mousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  };

  // fix for clipping: add padding around SVG equal to strokeWidth
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
      onDoubleClick={() => setEditing(true)}
    >
        {!editing && (
          <svg
            width={width + pad}
            height={height + pad}
            style={{ overflow: "visible", pointerEvents: "none" }}
          >
            <g transform={`translate(${pad / 2}, ${pad / 2})`}>
              {renderShape(node, height)}
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
        )}
        {editing && (
        <textarea
          autoFocus
          ref={textareaRef}
          defaultValue={text}
          onBlur={e => {
            setText(e.target.value);
            setEditing(false);
          }}
          onChange={e => {
            setText(e.target.value);
            const newHeight = textareaRef.current!.scrollHeight;
            setHeight(newHeight);
            //also adjust the node height state for the SVG shape
          }}
          style={{
            position: "absolute",
            left: pad / 2,
            top: pad / 2,
            width: width,
            height: height,
            color: node.style?.textColor || "#000",
            fontSize: node.style?.fontSize,
            fontWeight: node.style?.fontWeight || "normal",
          }}
        />
      )}
    </div>
    
  );
};


function renderShape(node: NodeData, height: number) { 
// temporary height parameter, will refactor later
//  to accept states of Node data
  const stroke = node.style?.borderWidth || 2;

  switch (node.type) {
    case "rectangle":
      return (
        <rect
          width={node.width}
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
          points={`${node.width / 2},0 ${node.width},${height / 2} ${node.width / 2},${height} 0,${height / 2}`}
          fill={node.style?.backgroundColor || "#fff"}
          stroke={node.style?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );
    // TO DO: more cases for other shapes
    default:
      return null;
  }
}