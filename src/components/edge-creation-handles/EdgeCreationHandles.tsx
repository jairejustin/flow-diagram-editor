import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useEdgeCreation } from "../../hooks/edge-hooks/useEdgeCreation";
import { useNodeById, useDragState } from "../../store/flowStore";
import { memo } from "react";

type EdgeHandle = "n" | "s" | "e" | "w";

interface EdgeCreationHandlesProps {
  nodeId: string;
  isMobile: boolean;
}

export const EdgeCreationHandles = memo(
  ({ nodeId, isMobile }: EdgeCreationHandlesProps) => {
    const node = useNodeById(nodeId);
    const dragState = useDragState();
    const { onHandlePointerDown } = useEdgeCreation(
      nodeId,
      dragState.position !== null && dragState.nodeId === nodeId
        ? dragState.position!
        : node?.position || { x: 0, y: 0 },
      node?.width || 0,
      node?.height || 0
    );

    if (!node) return null;

    // Sync with drag state so handles don't lag behind while moving
    const isDragging =
      dragState.nodeId === nodeId && dragState.position !== null;
    const position = isDragging ? dragState.position! : node.position;
    const { width, height } = node;

    const handleSize = isMobile ? 30 : 20;
    const offset = isMobile ? 30 : 20;

    const edgeHandles: {
      handle: EdgeHandle;
      x: number;
      y: number;
      Icon: typeof ArrowUp;
    }[] = [
      {
        handle: "n",
        x: width / 2 - handleSize / 2,
        y: -offset - handleSize / 2,
        Icon: ArrowUp,
      },
      {
        handle: "s",
        x: width / 2 - handleSize / 2,
        y: height + offset - handleSize / 2,
        Icon: ArrowDown,
      },
      {
        handle: "e",
        x: width + offset - handleSize / 2,
        y: height / 2 - handleSize / 2,
        Icon: ArrowRight,
      },
      {
        handle: "w",
        x: -offset - handleSize / 2,
        y: height / 2 - handleSize / 2,
        Icon: ArrowLeft,
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
          zIndex: 999,
        }}
      >
        {edgeHandles.map(({ handle, x, y, Icon }) => (
          <div
            key={handle}
            className="edge-creation-handle"
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: handleSize,
              height: handleSize,
              backgroundColor: "#6b7280",
              border: "2px solid #fff",
              borderRadius: "50%",
              pointerEvents: "auto",
              zIndex: 10,
              opacity: 0.5,
              transition: "transform 0.15s ease, opacity 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPointerDown={(e) => onHandlePointerDown(e, handle)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.3)";
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.opacity = "0.5";
            }}
          >
            <Icon size={16} color="white" strokeWidth={2.5} />
          </div>
        ))}
      </div>
    );
  }
);
