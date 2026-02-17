import React, { useState } from "react";
import { Node } from "../../components/node/Node";
import { Edge } from "../../components/edge/Edge";
import Toolbar from "../../components/toolbar/Toolbar";
import { ViewportControls } from "../../components/viewport-controls/ViewportControls";
import {
  useIsExporting,
  useIsMobile,
  useNodeIds,
  useEdgeIds,
  useSelectedEdgeId,
  useSelectedNodeId,
  useSetShowPanel,
  useShowPanel,
  useViewport,
} from "../../store/flowStore";
import NodeStylePanel from "../../components/style-panel/NodeStylePanel";
import EdgeStylePanel from "../../components/style-panel/EdgeStylePanel";
import { ResizeHandles } from "../../components/resize-handles/ResizeHandles";
import { useCanvasPan } from "../../hooks/canvas-hooks/useCanvasPan";
import { useKeyboardShortcuts } from "../../hooks/canvas-hooks/useKeyboardShortcuts";
import { EdgeCreationHandles } from "../../components/edge-creation-handles/EdgeCreationHandles";
import { Edit3 } from "lucide-react";
import { ExportOverlay } from "../../components/export-overlay/ExportOverlay";
import "./CanvasPage.css";
import HistoryControls from "../../components/history-controls/HistoryControls";

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
    <button className="mobile-toggle-editor-button" onPointerDown={handleClick}>
      <Edit3 />
    </button>
  );
};

export const CanvasPage = () => {
  const selectedNodeId = useSelectedNodeId();
  const selectedEdgeId = useSelectedEdgeId();
  const viewport = useViewport();
  const isNarrow = useIsMobile();
  const showPanel = useShowPanel();
  const isExporting = useIsExporting();
  const setShowPanel = useSetShowPanel();

  const nodeIds = useNodeIds();
  const edgeIds = useEdgeIds();

  const [translateX, setTranslateX] = useState(viewport.x);
  const [translateY, setTranslateY] = useState(viewport.y);
  const [scale, setScale] = useState(viewport.zoom);
  const [isPanning, setIsPanning] = useState(false);

  useKeyboardShortcuts();

  const { 
    handlePointerDown,
    handleWheel,
    handleReset, 
    handleZoomIn,
    handleZoomOut 
} = useCanvasPan(
    translateX,
    translateY,
    scale,
    setTranslateX,
    setTranslateY,
    setScale,
    isPanning,
    setIsPanning
  );

  return (
    <>
      <div
        id="canvas-container"
        className="canvas"
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
      >
        {!isExporting && (
          <>
            <Toolbar />
            {selectedNodeId && (!isNarrow || showPanel) && (
              <NodeStylePanel id={selectedNodeId} />
            )}
            {selectedEdgeId && (!isNarrow || showPanel) && (
              <EdgeStylePanel id={selectedEdgeId} />
            )}
            {isNarrow && (selectedNodeId || selectedEdgeId) && (
              <ToggleEditor
                isOpen={showPanel}
                onToggle={() => setShowPanel(!showPanel)}
              />
            )}
            <ViewportControls
              zoomFactor={scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
            />
            <HistoryControls />
          </>
        )}
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
            {edgeIds.map((id) => (
              <Edge key={id} id={id} />
            ))}
          </svg>

          {nodeIds.map((id) => (
            <React.Fragment key={id}>
              <Node id={id} />
              {selectedNodeId === id && (
                <>
                  <ResizeHandles nodeId={id} scale={scale} />
                  <EdgeCreationHandles nodeId={id} isMobile={isNarrow} />
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      {isExporting && <ExportOverlay />}
    </>
  );
}

export default CanvasPage;