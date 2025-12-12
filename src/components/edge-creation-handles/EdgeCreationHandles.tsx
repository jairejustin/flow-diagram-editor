import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useEdgeCreation } from "../../hooks/useEdgeCreation";

type EdgeHandle = "n" | "s" | "e" | "w";

interface EdgeCreationHandlesProps {
  nodeId: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  scale: number;
}

export const EdgeCreationHandles = ({
  nodeId,
  position,
  width,
  height,
}: EdgeCreationHandlesProps) => {
  const { onHandleMouseDown, onHandleTouchStart } = useEdgeCreation(
    nodeId,
    position,
    width,
    height
  );

  const handleSize = 20;
  const offset = 20; 

  const edgeHandles: { 
    handle: EdgeHandle; 
    x: number; 
    y: number; 
    Icon: typeof ArrowUp;
  }[] = [
    { handle: "n", x: width / 2 - handleSize / 2, y: -offset - handleSize / 2, Icon: ArrowUp },
    { handle: "s", x: width / 2 - handleSize / 2, y: height + offset - handleSize / 2, Icon: ArrowDown },
    { handle: "e", x: width + offset - handleSize / 2, y: height / 2 - handleSize / 2, Icon: ArrowRight },
    { handle: "w", x: -offset - handleSize / 2, y: height / 2 - handleSize / 2, Icon: ArrowLeft },
  ];

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: width,
        height: height,
        pointerEvents: "none",
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
          onMouseDown={(e) => onHandleMouseDown(e, handle)}
          onTouchStart={(e) => onHandleTouchStart(e, handle)}
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
};