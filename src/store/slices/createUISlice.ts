import type { StateCreator } from "zustand";
import type { FlowState, UISlice } from "../types";

export const createUISlice: StateCreator<FlowState, [], [], UISlice> = (
  set,
  get
) => ({
  dragState: { nodeId: null, position: null },
  viewport: { x: 0, y: 0, zoom: 1 },
  isDraggingNode: false,
  isResizingNode: false,
  isDraggingEdge: false,
  isExporting: false,
  isMobile: window.matchMedia("(max-width: 500px)").matches,
  showPanel: false,
  viewMode: false,

  loadMockData: (mockDoc) => {
    const { nodes } = get();
    if (nodes.length === 0) {
      set({
        nodes: mockDoc.nodes.map((node) => ({ ...node, editing: false })),
        edges: mockDoc.edges,
        viewport: mockDoc.viewport,
      });
    }
  },

  setDragState: (nodeId, position) => set({ dragState: { nodeId, position } }),
  setViewport: (viewport) => set({ viewport }),
  setIsDraggingNode: (isDraggingNode) => set({ isDraggingNode }),
  setIsResizingNode: (isResizingNode) => set({ isResizingNode }),
  setIsDraggingEdge: (isDraggingEdge) => set({ isDraggingEdge }),
  setShowPanel: (showPanel) => set({ showPanel }),
  setViewMode: (viewMode) => set({ viewMode }),
  setIsExporting: (isExporting) => set({ isExporting }),
});
