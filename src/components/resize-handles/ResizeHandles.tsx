import { useRef } from "react";
import { useFlowStore } from "../../store/flowStore";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

interface ResizeHandlesProps {
  nodeId: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  scale: number;
  borderPad: number;
}

export const ResizeHandles = ({ nodeId, position, width, height, scale, borderPad }: ResizeHandlesProps) => {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const resizeHandleRef = useRef<ResizeHandle | null>(null);

  const updateNodePosition = useFlowStore((state) => state.updateNodePosition);
  const updateNodeSize = useFlowStore((state) => state.updateNodeDimensions);
  const setIsResizingNode = useFlowStore((state) => state.setIsResizingNode);

  const onResize = (clientX: number, clientY: number) => {
    if (!resizeHandleRef.current) return;

    const dx = (clientX - mousePosRef.current.x) / scale;
    const dy = (clientY - mousePosRef.current.y) / scale;
    const handle = resizeHandleRef.current;

    let newWidth = startSizeRef.current.width;
    let newHeight = startSizeRef.current.height;
    let newX = startPosRef.current.x;
    let newY = startPosRef.current.y;

    const minSize = 50;

    if (handle.includes("e")) {
      newWidth = Math.max(minSize, startSizeRef.current.width + dx);
    }
    if (handle.includes("w")) {
      const proposedWidth = startSizeRef.current.width - dx;
      if (proposedWidth >= minSize) {
        newWidth = proposedWidth;
        newX = startPosRef.current.x + dx;
      }
    }
    if (handle.includes("s")) {
      newHeight = Math.max(minSize, startSizeRef.current.height + dy);
    }
    if (handle.includes("n")) {
      const proposedHeight = startSizeRef.current.height - dy;
      if (proposedHeight >= minSize) {
        newHeight = proposedHeight;
        newY = startPosRef.current.y + dy;
      }
    }

    updateNodeSize(nodeId, newWidth, newHeight);
    updateNodePosition(nodeId, { x: newX, y: newY });
  };

  const onMouseMove = (e: MouseEvent) => {
    onResize(e.clientX, e.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    onResize(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onEnd = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onEnd);
    
    setIsResizingNode(false);
    resizeHandleRef.current = null;
  };

  const onResizeHandleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();

    mousePosRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: position.x, y: position.y };
    startSizeRef.current = { width, height };
    resizeHandleRef.current = handle;
    setIsResizingNode(true);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
  };

  const onResizeHandleTouchStart = (e: React.TouchEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();

    mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    startPosRef.current = { x: position.x, y: position.y };
    startSizeRef.current = { width, height };
    resizeHandleRef.current = handle;
    setIsResizingNode(true);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  };

  const handleSize = 8;
  const pad = borderPad;

  const resizeHandles: { handle: ResizeHandle; cursor: string; x: number; y: number }[] = [
    { handle: "nw", cursor: "nwse-resize", x: -handleSize / 2, y: -handleSize / 2 },
    { handle: "ne", cursor: "nesw-resize", x: width + pad - handleSize / 2, y: -handleSize / 2 },
    { handle: "sw", cursor: "nesw-resize", x: -handleSize / 2, y: height + pad - handleSize / 2 },
    { handle: "se", cursor: "nwse-resize", x: width + pad - handleSize / 2, y: height + pad - handleSize / 2 },
    { handle: "n", cursor: "ns-resize", x: (width + pad) / 2 - handleSize / 2, y: -handleSize / 2 },
    { handle: "s", cursor: "ns-resize", x: (width + pad) / 2 - handleSize / 2, y: height + pad - handleSize / 2 },
    { handle: "e", cursor: "ew-resize", x: width + pad - handleSize / 2, y: (height + pad) / 2 - handleSize / 2 },
    { handle: "w", cursor: "ew-resize", x: -handleSize / 2, y: (height + pad) / 2 - handleSize / 2 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: width + pad,
        height: height + pad,
        pointerEvents: "none",
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
            backgroundColor: "#4A90E2",
            border: "1px solid #fff",
            borderRadius: "50%",
            cursor,
            pointerEvents: "auto",
            zIndex: 10,
          }}
          onMouseDown={(e) => onResizeHandleMouseDown(e, handle)}
          onTouchStart={(e) => onResizeHandleTouchStart(e, handle)}
        />
      ))}
    </div>
  );
};