import { useState, useRef, useEffect } from "react";
import type { FlowDocument } from "../../lib/types";
import { Node } from "../../components/node/Node";
import { Edge } from "../../components/edge/Edge";
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
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);

  // select node callback function
  const selectNode = (id: string | null) => useFlowStore.setState({ selectedNodeId: id });
  
  // Subscribe to nodes from store so edges update when nodes move
  const nodes = useFlowStore((state) => state.nodes);
  const edges = flowDocument.edges;

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
  // Check if we're clicking on an interactive element
  const target = event.target as HTMLElement;
  if (
    isDraggingNode || 
    target.closest('.style-panel') || 
    target.closest('.toolbar') ||
    target.closest('.zoom-controls') ||
    target.closest('.node') || 
    target.closest('.edge')
  ) {
    return;
  }

  useFlowStore.setState({ selectedNodeId: null });
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
    if (event.target !== event.currentTarget) return;
    if (isDraggingNode) return;
    
    setIsPanning(true);
    useFlowStore.setState({ selectedNodeId: null });
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
      { selectedNodeId ? (
      <StylePanel nodeId={selectedNodeId}/>
      ) : null }
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
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="black" />
            </marker>
          </defs>
          {edges.map((edge) => (
            <Edge key={edge.id} edge={edge} nodes={nodes} />
          ))}
        </svg>
        {nodes.map((node) => (
          <Node 
          key={node.id}
          node={node} 
          selectNode={selectNode}/>
        ))}
      </div>
    </div>
  );
}