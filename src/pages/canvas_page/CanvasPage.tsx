import React, { useState } from "react";
import { Node } from "../../components/node/Node";
import { Edge } from "../../components/edge/Edge";
import Toolbar from "../../components/toolbar/Toolbar";
import ZoomControls from "../../components/zoom-controls/ZoomControls";
import { useFlowStore } from "../../store/flowStore";
import StylePanel from "../../components/style-panel/StylePanel";
import { ResizeHandles } from "../../components/resize-handles/ResizeHandles";
import { useCanvasPan } from "../../hooks/useCanvasPan";
import "./CanvasPage.css";

export default function CanvasPage() {
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const viewport = useFlowStore((state) => state.viewport);

  // Subscribe to nodes and edges from store
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  // Use viewport from store directly instead of syncing to local state
  const [translateX, setTranslateX] = useState(viewport.x);
  const [translateY, setTranslateY] = useState(viewport.y);
  const [scale, setScale] = useState(viewport.zoom);
  const [isPanning, setIsPanning] = useState(false);

  const { handleMouseDown, handleTouchStart, handleWheel } = useCanvasPan(
    translateX,
    translateY,
    scale,
    setTranslateX,
    setTranslateY,
    setScale,
    isPanning,
    setIsPanning
  );

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
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
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
            <Node node={node} />
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