import React, { useState } from "react";
import { Node } from "../../components/node/Node";
import { Edge } from "../../components/edge/Edge";
import Toolbar from "../../components/toolbar/Toolbar";
import ZoomControls from "../../components/zoom-controls/ZoomControls";
import { useFlowStore } from "../../store/flowStore";
import StylePanel from "../../components/style-panel/StylePanel";
import { ResizeHandles } from "../../components/resize-handles/ResizeHandles";
import { useCanvasPan } from "../../hooks/useCanvasPan";
import { getAnchorPoint } from "../../lib/utils";
import { EdgeCreationHandles } from "../../components/edge-creation-handles/EdgeCreationHandles";
import { Edit3 } from "lucide-react";
import "./CanvasPage.css";

interface ToggleEditorProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ToggleEditor = ({ onToggle }: ToggleEditorProps) => {
  const handleClick = (e: React.PointerEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle();
  };

  return (
    <button 
      className="mobile-toggle-editor-button"
      onPointerDown={handleClick}
    >
      <Edit3/>
    </button>
  )
}

export default function CanvasPage() {
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const selectedEdgeId = useFlowStore((state) => state.selectedEdgeId);
  const viewport = useFlowStore((state) => state.viewport);
  const isNarrow = useFlowStore((state) => state.isMobile);
  const showPanel = useFlowStore((state) => state.showPanel);
  const setShowPanel = useFlowStore((state) => state.setShowPanel);


  // Subscribe to nodes and edges from store
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  // Use viewport from store directly instead of syncing to local state
  const [translateX, setTranslateX] = useState(viewport.x);
  const [translateY, setTranslateY] = useState(viewport.y);
  const [scale, setScale] = useState(viewport.zoom);
  const [isPanning, setIsPanning] = useState(false);
  
  const { handlePointerDown, handleWheel } = useCanvasPan(
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
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      style={{
        touchAction: 'none',
      }}
    >
      <Toolbar />
      {selectedNodeId && (!isNarrow || showPanel) && (
        <StylePanel id={selectedNodeId} type="Node"/>
      )}
      {selectedEdgeId && (!isNarrow || showPanel) && (
        <StylePanel id={selectedEdgeId} type="Edge" />
      )}
      {isNarrow && (selectedNodeId || selectedEdgeId) && (
        <ToggleEditor 
          isOpen={showPanel}
          onToggle={() => setShowPanel(!showPanel)}
        />
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
          {edges.map((edge) => (
            <Edge key={edge.id} edge={edge} nodes={nodes} />
          ))}
        </svg>
        {nodes.map((node) => (
          <React.Fragment key={node.id}>
            <Node node={node} />
            {selectedNodeId === node.id && !node.editing && (
              <>
                <ResizeHandles
                  nodeId={node.id}
                  position={node.position}
                  width={node.width}
                  height={node.height}
                  scale={scale}
                />
                <EdgeCreationHandles
                  nodeId={node.id}
                  position={node.position}
                  width={node.width}
                  height={node.height}
                  scale={scale}
                />
              </>
            )}
          </React.Fragment>
        ))}

        {/* temporary solution to put the dots above nodes in z-index */}
        {selectedEdgeId && (() => {
          const edge = edges.find(e => e.id === selectedEdgeId);
          if (!edge) return null;
          
          const fromNode = nodes.find(n => n.id === edge.from);
          if (!fromNode) return null;
          
          const p1 = getAnchorPoint(fromNode, edge.fromAnchor);
          let p2;
          
          if (typeof edge.to === "string") {
            const toNode = nodes.find(n => n.id === edge.to);
            if (!toNode) return null;
            p2 = getAnchorPoint(toNode, edge.toAnchor);
          } else {
            p2 = edge.to;
          }
          
          const color = edge.style?.color || "black";
          
          return (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: p1.x,
                  top: p1.y,
                  width: 10,
                  height: 10,
                  marginLeft: -8,
                  marginTop: -8,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid white',
                  pointerEvents: 'auto',
                  cursor: 'grab',
                  zIndex: 1000,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: p2.x,
                  top: p2.y,
                  width: 10,
                  height: 10,
                  marginLeft: -8,
                  marginTop: -8,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid white',
                  pointerEvents: 'auto',
                  cursor: 'grab',
                  zIndex: 1000,
                }}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
}