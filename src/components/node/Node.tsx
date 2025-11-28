import { useRef, useState } from "react";
import type { NodeData } from "../../lib/types";
import "./Node.css";

export const Node = ({ node }: { node: NodeData }) => {
  const [position, setPosition] = useState(node.position);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(node.content);

  const wrapperRef = useRef<HTMLDivElement>(null);
  let mousePos = { x: 0, y: 0 };

  const onMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - mousePos.x;
    const dy = e.clientY - mousePos.y;
    mousePos = { x: e.clientX, y: e.clientY };
    setPosition(pos => ({ x: pos.x + dx, y: pos.y + dy }));
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editing) return;
    mousePos = { x: e.clientX, y: e.clientY };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // fix for clipping: add padding around SVG equal to strokeWidth
  const border = node.style?.borderWidth || 2;
  const pad = border * 2;

  const w = node.width;
  const h = node.height;

  return (
    <div
      ref={wrapperRef}
      className="node"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: w + pad,
        height: h + pad,
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={() => setEditing(true)}
    >
      {!editing && (
        <svg
          width={w + pad}
          height={h + pad}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <g transform={`translate(${pad / 2}, ${pad / 2})`}>
            {renderShape(node)}
            <text
              x={w / 2}
              y={h / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fill={node.style?.textColor || "#000"}
              fontSize={node.style?.fontSize || 14}
              fontWeight={node.style?.fontWeight || "normal"}
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {text}
            </text>
          </g>
        </svg>
      )}

      {editing && (
        <textarea
          autoFocus
          className="node-textarea"
          defaultValue={text}
          onBlur={e => {
            setText(e.target.value);
            setEditing(false);
          }}
          style={{
            position: "absolute",
            left: pad / 2,
            top: pad / 2,
            width: w,
            height: h,
            color: node.style?.textColor || "#000",
            fontSize: node.style?.fontSize || 14,
            fontWeight: node.style?.fontWeight || "normal",
          }}
        />
      )}
    </div>
  );
};

function renderShape(node: NodeData) {
  const w = node.width;
  const h = node.height;
  const s = node.style;
  const stroke = s?.borderWidth || 2;

  switch (node.type) {
    case "rectangle":
      return (
        <rect
          width={w}
          height={h}
          fill={s?.backgroundColor || "#fff"}
          stroke={s?.borderColor || "#333"}
          strokeWidth={stroke}
          rx={s?.borderRadius || 0}
        />
      );

    case "diamond":
      return (
        <polygon
          points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
          fill={s?.backgroundColor || "#fff"}
          stroke={s?.borderColor || "#333"}
          strokeWidth={stroke}
        />
      );

    // TO DO: more cases for other shapes

    default:
      return null;
  }
}
