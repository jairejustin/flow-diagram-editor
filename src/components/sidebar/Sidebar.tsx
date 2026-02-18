import { useState } from "react";
import {
  ShapesIcon,
  Diamond,
  Square,
  Eye,
  EyeOff,
  ImageDownIcon,
  Plus,
  Minus,
  RefreshCcw,
  Menu,
  Info,
} from "lucide-react";
import {
  ParallelogramIcon,
  EllipseIcon,
  TrapezoidIcon,
  DocumentIcon,
} from "../../assets/CustomSVGIcons";
import {
  useViewMode,
  useSetViewMode,
  useSetIsExporting,
  useSelectNode,
  useSelectEdge,
  useAddNode,
} from "../../store/flowStore";
import "./Sidebar.css";
import type { NodeShape } from "../../lib/types";

interface SidebarProps {
  zoomFactor: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function Sidebar({
  zoomFactor,
  onZoomIn,
  onZoomOut,
  onReset,
}: SidebarProps) {
  const [openCreateNode, setOpenCreateNode] = useState(false);
  const viewMode = useViewMode();
  const setViewMode = useSetViewMode();
  const setIsExporting = useSetIsExporting();
  const setSelectedNodeId = useSelectNode();
  const setSelectedEdgeId = useSelectEdge();
  const addNode = useAddNode();

  const handleAddNode = (shape: NodeShape) => {
    addNode({ shape });
    setOpenCreateNode(false);
  };

  const toggleViewMode = () => {
    if (!viewMode) {
      setOpenCreateNode(false);
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
    }
    setViewMode(!viewMode);
  };

  const toggleExportMode = () => {
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
    setIsExporting(true);
  };

  return (
    <div className="sidebar">
      <div className="sidebar__options">
        {!viewMode && (
          <button className="sidebar__button">
            <Menu />
          </button>
        )}

        <button
          className={`sidebar__button ${viewMode ? "active" : ""}`}
          onClick={toggleViewMode}
        >
          {viewMode ? <Eye /> : <EyeOff />}
        </button>

        {!viewMode && (
          <button
            className={`sidebar__button ${openCreateNode ? "active" : ""}`}
            onClick={() => setOpenCreateNode(!openCreateNode)}
          >
            <ShapesIcon />
          </button>
        )}

        {!viewMode && (
          <button className="sidebar__button" onClick={toggleExportMode}>
            <ImageDownIcon />
          </button>
        )}

        {!viewMode && (
          <button
            className="sidebar__button"
            onClick={() =>
              window.open(
                "https://github.com/jairejustin/flow-diagram-editor",
                "_blank"
              )
            }
          >
            <Info />
          </button>
        )}
      </div>

      {/* Shapes Popover Menu */}
      {openCreateNode && (
        <div className="sidebar__shapes-menu">
          <button
            className="sidebar__button"
            onClick={() => handleAddNode("rectangle")}
          >
            <Square />
          </button>
          <button
            className="sidebar__button"
            onClick={() => handleAddNode("diamond")}
          >
            <Diamond />
          </button>
          <button
            className="sidebar__button"
            onClick={() => handleAddNode("ellipse")}
          >
            <EllipseIcon />
          </button>
          <button
            className="sidebar__button"
            onClick={() => handleAddNode("parallelogram")}
          >
            <ParallelogramIcon />
          </button>
          <button
            className="sidebar__button"
            onClick={() => handleAddNode("trapezoid")}
          >
            <TrapezoidIcon />
          </button>
          <button
            className="sidebar__button"
            onClick={() => handleAddNode("document")}
          >
            <DocumentIcon />
          </button>
        </div>
      )}

      <div className="sidebar__options sidebar__zoom">
        <p className="sidebar__zoom-text">{Math.round(zoomFactor * 100)}%</p>
        <button className="sidebar__button" onClick={onZoomIn}>
          <Plus />
        </button>
        <button className="sidebar__button" onClick={onZoomOut}>
          <Minus />
        </button>
        <button className="sidebar__button" onClick={onReset}>
          <RefreshCcw />
        </button>
      </div>
    </div>
  );
}
