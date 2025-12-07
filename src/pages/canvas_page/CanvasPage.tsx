import React, { useState, useRef, useEffect } from "react";
import { Node } from "../../components/node/Node";
import { Edge } from "../../components/edge/Edge";
import Toolbar from "../../components/toolbar/Toolbar";
import ZoomControls from "../../components/zoom-controls/ZoomControls";
import { useFlowStore } from "../../store/flowStore";
import StylePanel from "../../components/style-panel/StylePanel";
import "./CanvasPage.css";
import { ResizeHandles } from "../../components/resize-handles/ResizeHandles";

export default function CanvasPage() {
  const isDraggingNode = useFlowStore((state) => state.isDraggingNode);
  const isResizingNode = useFlowStore((state) => state.isResizingNode);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const setViewport = useFlowStore((state) => state.setViewport);
  const viewport = useFlowStore((state) => state.viewport);

  // select node callback function
  const selectNode = (id: string | null) => useFlowStore.setState({ selectedNodeId: id });
  
  // Subscribe to nodes and edges from store
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  // Initialize viewport from store
  const [translateX, setTranslateX] = useState(viewport.x);
  const [translateY, setTranslateY] = useState(viewport.y);
  const [scale, setScale] = useState(viewport.zoom);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Sync local state with viewport from store when store viewport changes
  useEffect(() => {
    setTranslateX(viewport.x);
    setTranslateY(viewport.y);
    setScale(viewport.zoom);
  }, [viewport.x, viewport.y, viewport.zoom]);

  // Sync local viewport changes to store (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setViewport({ x: translateX, y: translateY, zoom: scale });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [translateX, translateY, scale, setViewport]);

  const handleMouseDown = (event: React.MouseEvent) => {
    // Check if we're clicking on an interactive element
    const target = event.target as HTMLElement;
    if (
      isDraggingNode ||
      isResizingNode ||
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
    event.preventDefault();
    
    const target = event.target as HTMLElement;
    if (
      isDraggingNode ||
      isResizingNode ||
      target.closest('.style-panel') ||
      target.closest('.toolbar') ||
      target.closest('.zoom-controls') ||
      target.closest('.node') ||
      target.closest('.edge')
    ) {
      return;
    }
    
    setIsPanning(true);
    useFlowStore.setState({ selectedNodeId: null });
    lastMousePos.current = { 
      x: event.touches[0].clientX, 
      y: event.touches[0].clientY 
    };
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isPanning) return;
    
    event.preventDefault();
    
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
      style={{
        touchAction: 'none',
      }}
    >
      <Toolbar />
      {selectedNodeId && (
        <StylePanel nodeId={selectedNodeId} />
      )}
      <ZoomControls
        zoomFactor={scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
      <div
        style={{
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
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
          <React.Fragment key={node.id}>
            <Node node={node} selectNode={selectNode} />
            {selectedNodeId === node.id && !node.editing && (
              <ResizeHandles
                nodeId={node.id}
                position={node.position}
                width={node.width}
                height={node.height}
                scale={scale}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}