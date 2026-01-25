import type {
  NodeData,
  EdgeData,
  Viewport,
  position,
  NodeStyle,
  EdgeStyle,
  EdgeLabel,
  EdgeAnchor,
  EdgePathType,
  FlowDocument,
} from "../lib/types";

export interface DragState {
  nodeId: string | null;
  position: position | null;
}

export interface NodeSlice {
  nodes: NodeData[];
  selectedNodeId: string | null;

  addNode: (nodeData?: Partial<NodeData>) => string;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  updateNodePosition: (id: string, newPosition: position) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  updateNodeContent: (id: string, content: string) => void;
  updateNodeStyles: (id: string, style: Partial<NodeStyle>) => void;
  resetEditingStates: () => void;
  setNodes: (nodes: NodeData[]) => void;
}

export interface EdgeSlice {
  edges: EdgeData[];
  selectedEdgeId: string | null;

  selectEdge: (id: string | null) => void;
  addEdge: (edgeData?: Partial<EdgeData>) => string;
  updateEdgeLabel: (id: string, label: EdgeLabel | undefined) => void;
  deleteEdge: (id: string) => void;
  updateEdgeHead: (
    id: string,
    to: string | position,
    toAnchor?: EdgeAnchor
  ) => void;
  updateEdgeTail: (
    id: string,
    from: string | position,
    fromAnchor?: EdgeAnchor
  ) => void;
  flipEdge: (id: string) => void;
  setEdges: (edges: EdgeData[]) => void;
  updateEdgeStyles: (id: string, style: Partial<EdgeStyle>) => void;
  updateEdgeSegmentPosition: (
    id: string,
    segmentIndex: number,
    change: { axis: "x" | "y"; value: number }
  ) => void;
  convertToStraight: (id: string) => void;
  convertToElbow: (id: string) => void;
  updateEdgePath: (id: string, path: EdgePathType) => void;
}

export interface UISlice {
  dragState: DragState;
  viewport: Viewport;
  isDraggingNode: boolean;
  isResizingNode: boolean;
  isDraggingEdge: boolean;
  isExporting: boolean;
  isMobile: boolean;
  showPanel: boolean;
  viewMode: boolean;

  loadMockData: (mockDoc: FlowDocument) => void;
  setViewport: (viewport: Viewport) => void;
  setDragState: (nodeId: string | null, position: position | null) => void;
  setIsDraggingNode: (isDragging: boolean) => void;
  setIsResizingNode: (isResizing: boolean) => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  setShowPanel: (showPanel: boolean) => void;
  setViewMode: (viewMode: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
}

export type FlowState = NodeSlice & EdgeSlice & UISlice;
