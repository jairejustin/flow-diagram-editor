import { useState, useRef, useEffect } from "react";
import type { FlowDocument } from "../../lib/types";
import { Node } from "../../components/node/Node";
import Toolbar from "../../components/toolbar/Toolbar";
import ZoomControls from "../../components/zoom-controls/ZoomControls";
import { useFlowStore } from "../../store/flowStore";
import StylePanel from "../../components/style-panel/StylePanel";
import "./CanvasPage.css";

interface CanvasPageProps {
  flowDocument: FlowDocument;
}

export default function CanvasPage({ flowDocument }: CanvasPageProps) {
  const isDraggingNode = useFlowStore((state) => state.isDraggingNode);
  
  //use flowDocument nodes for initial render
  //node component will subscribe to its own data from the store
  const nodes = Object.values(flowDocument.nodes);

  //initialize store once on mount
  useEffect(() => {
    useFlowStore.getState().setNodes(flowDocument.nodes);
  }, []);

  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    //prevent panning when dragging a node
    if (isDraggingNode) return;
    
    setIsPanning(true);
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isPanning) return;
    
    const dx = event.clientX - lastMousePos.current.x;
    const dy = event.clientY - lastMousePos.current.y;
    setTranslateX((prev) => prev + dx);
    setTranslateY((prev) => prev + dy);
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
  if (isDraggingNode) return;
  
  setIsPanning(true);
  lastMousePos.current = { 
    x: event.touches[0].clientX, 
    y: event.touches[0].clientY 
  };
};

const handleTouchMove = (event: React.TouchEvent) => {
  if (!isPanning) return;
  
  const dx = event.touches[0].clientX - lastMousePos.current.x;
  const dy = event.touches[0].clientY - lastMousePos.current.y;
  setTranslateX((prev) => prev + dx);
  setTranslateY((prev) => prev + dy);
  lastMousePos.current = { 
    x: event.touches[0].clientX, 
    y: event.touches[0].clientY 
  };
};

const handleTouchEnd = () => {
  setIsPanning(false);
};

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const scaleFactor = 1.1;
    const newScale = event.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;

    if (newScale > 0.1 && newScale < 5) {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const newTranslateX = mouseX - (mouseX - translateX) * (newScale / scale);
      const newTranslateY = mouseY - (mouseY - translateY) * (newScale / scale);
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      setScale(newScale);
    }
  };

  function snap(value: number) {
    return Math.round(value * 1000) / 1000;
  }

  const onZoomIn = () => {
    const next = snap(scale + 0.05);
    if (next <= 5) setScale(next);
  };

  const onZoomOut = () => {
    const next = snap(scale - 0.05);
    if (next >= 0.1) setScale(next);
  };

  return (
    <div
      className="canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Toolbar />
      <StylePanel />
      <ZoomControls
        zoomFactor={scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
      <div
        style={{
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: "0 0",
          overflow: "visible",
        }}
      >
        {nodes.map((node) => (
          <Node key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}