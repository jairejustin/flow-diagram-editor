import { useNodeResize } from "../../hooks/node-hooks/useNodeResize";
import { useIsMobile, useNodeById, useDragState } from "../../store/flowStore";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

interface ResizeHandlesProps {
  nodeId: string;
  scale: number;
}

export const ResizeHandles = ({ nodeId, scale }: ResizeHandlesProps) => {
  const node = useNodeById(nodeId)!;
  const dragState = useDragState();
  const isMobile = useIsMobile();

  // resolve Position (transient vs persistent)
  // this ensures handles follow the node during a drag
  const isDragging = dragState.nodeId === nodeId && dragState.position !== null;
  const position = isDragging ? dragState.position! : node.position;
  const { width, height } = node;

  const { onResizeHandlePointerDown } = useNodeResize(
    nodeId,
    position,
    width,
    height,
    scale
  );

  if (!node) return null;

  const handleSize = isMobile ? 18 : 8;

  const resizeHandles: {
    handle: ResizeHandle;
    cursor: string;
    x: number;
    y: number;
  }[] = [
    {
      handle: "nw",
      cursor: "nwse-resize",
      x: -handleSize / 2,
      y: -handleSize / 2,
    },
    {
      handle: "ne",
      cursor: "nesw-resize",
      x: width - handleSize / 2,
      y: -handleSize / 2,
    },
    {
      handle: "sw",
      cursor: "nesw-resize",
      x: -handleSize / 2,
      y: height - handleSize / 2,
    },
    {
      handle: "se",
      cursor: "nwse-resize",
      x: width - handleSize / 2,
      y: height - handleSize / 2,
    },
    {
      handle: "n",
      cursor: "ns-resize",
      x: width / 2 - handleSize / 2,
      y: -handleSize / 2,
    },
    {
      handle: "s",
      cursor: "ns-resize",
      x: width / 2 - handleSize / 2,
      y: height - handleSize / 2,
    },
    {
      handle: "e",
      cursor: "ew-resize",
      x: width - handleSize / 2,
      y: height / 2 - handleSize / 2,
    },
    {
      handle: "w",
      cursor: "ew-resize",
      x: -handleSize / 2,
      y: height / 2 - handleSize / 2,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: width,
        height: height,
        pointerEvents: "none",
        border: `1px solid #4b5563`,
      }}
    >
      {resizeHandles.map(({ handle, cursor, x, y }) => (
        <div
          key={handle}
          className="resize-handle"
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: handleSize,
            height: handleSize,
            backgroundColor: "#4b5563",
            border: "1px solid #fff",
            borderRadius: "50%",
            cursor,
            pointerEvents: "auto",
            zIndex: 10,
          }}
          onPointerDown={(e) => onResizeHandlePointerDown(e, handle)}
        />
      ))}
    </div>
  );
};
