import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback } from "react";
import type { FlowState } from "./types";
import { createNodeSlice } from "./slices/createNodeSlice";
import { createEdgeSlice } from "./slices/createEdgeSlice";
import { createUISlice } from "./slices/createUISlice";
import { temporal } from "zundo";
import type { TemporalState } from "zundo";

const useFlowStore = create<FlowState>()(
  temporal(
    persist(
      (set, get, store) => ({
        ...createNodeSlice(set, get, store),
        ...createEdgeSlice(set, get, store),
        ...createUISlice(set, get, store),

        triggerUpdate: () => set((state) => ({ ...state })),
      }),
      {
        name: "flow-storage",
        partialize: (state) => ({
          nodes: state.nodes.map((node) => ({ ...node, editing: false })),
          edges: state.edges,
          viewport: state.viewport,
        }),
      }
    ),
    {
      limit: 100,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      equality: (a, b) => {
        // If they are the exact same reference, they are equal
        if (a === b) return true;
        // Otherwise, assume they are different to force an entry
        return false; 
      }
    },
    
  )
);

// History Actions
export function useHistory() {
  const temporalStore = useFlowStore.temporal as unknown as {
    getState: () => TemporalState<FlowState>;
  };

  const { undo, redo, pause, resume, clear, pastStates, futureStates } =
    temporalStore.getState();

  return {
    undo,
    redo,
    pause,
    resume,
    clear,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}

// Node Actions
export const useNodes = () => useFlowStore((state) => state.nodes);
export const useSelectedNodeId = () =>
  useFlowStore((state) => state.selectedNodeId);
export const useNodeById = (id: string | null) => {
  return useFlowStore(
    useCallback((state) => state.nodes.find((e) => e.id === id), [id])
  );
};
export const useAddNode = () => useFlowStore((state) => state.addNode);
export const useDeleteNode = () => useFlowStore((state) => state.deleteNode);
export const useSelectNode = () => useFlowStore((state) => state.selectNode);
export const useUpdateNodePosition = () =>
  useFlowStore((state) => state.updateNodePosition);
export const useUpdateNodeDimensions = () =>
  useFlowStore((state) => state.updateNodeDimensions);
export const useUpdateNodeContent = () =>
  useFlowStore((state) => state.updateNodeContent);
export const useUpdateNodeEditing = () =>
  useFlowStore((state) => state.updateNodeEditing);
export const useUpdateNodeStyles = () =>
  useFlowStore((state) => state.updateNodeStyles);
export const useResetEditingStates = () =>
  useFlowStore((state) => state.resetEditingStates);
export const useSetNodes = () => useFlowStore((state) => state.setNodes);

// Edge Actions
export const useEdges = () => useFlowStore((state) => state.edges);
export const useSelectedEdgeId = () =>
  useFlowStore((state) => state.selectedEdgeId);
export const useEdgeById = (id: string | null) => {
  return useFlowStore(
    useCallback((state) => state.edges.find((e) => e.id === id), [id])
  );
};
export const useSelectEdge = () => useFlowStore((state) => state.selectEdge);
export const useAddEdge = () => useFlowStore((state) => state.addEdge);
export const useUpdateEdgeLabel = () =>
  useFlowStore((state) => state.updateEdgeLabel);
export const useDeleteEdge = () => useFlowStore((state) => state.deleteEdge);
export const useUpdateEdgeHead = () =>
  useFlowStore((state) => state.updateEdgeHead);
export const useUpdateEdgeTail = () =>
  useFlowStore((state) => state.updateEdgeTail);
export const useFlipEdge = () => useFlowStore((state) => state.flipEdge);
export const useSetEdges = () => useFlowStore((state) => state.setEdges);
export const useUpdateEdgeStyles = () =>
  useFlowStore((state) => state.updateEdgeStyles);
export const useUpdateEdgeSegmentPosition = () =>
  useFlowStore((state) => state.updateEdgeSegmentPosition);
export const useConvertToStraight = () =>
  useFlowStore((state) => state.convertToStraight);
export const useConvertToElbow = () =>
  useFlowStore((state) => state.convertToElbow);
export const useUpdateEdgePath = () =>
  useFlowStore((state) => state.updateEdgePath);

// Viewport / UI Actions
export const useViewport = () => useFlowStore((state) => state.viewport);
export const useIsDraggingNode = () =>
  useFlowStore((state) => state.isDraggingNode);
export const useIsResizingNode = () =>
  useFlowStore((state) => state.isResizingNode);
export const useIsDraggingEdge = () =>
  useFlowStore((state) => state.isDraggingEdge);
export const useIsExporting = () => useFlowStore((state) => state.isExporting);
export const useIsMobile = () => useFlowStore((state) => state.isMobile);
export const useShowPanel = () => useFlowStore((state) => state.showPanel);
export const useViewMode = () => useFlowStore((state) => state.viewMode);
export const useLoadMockData = () =>
  useFlowStore((state) => state.loadMockData);
export const useSetViewport = () => useFlowStore((state) => state.setViewport);
export const useSetIsDraggingNode = () =>
  useFlowStore((state) => state.setIsDraggingNode);
export const useSetIsResizingNode = () =>
  useFlowStore((state) => state.setIsResizingNode);
export const useSetIsDraggingEdge = () =>
  useFlowStore((state) => state.setIsDraggingEdge);
export const useSetShowPanel = () =>
  useFlowStore((state) => state.setShowPanel);
export const useSetViewMode = () => useFlowStore((state) => state.setViewMode);
export const useSetIsExporting = () =>
  useFlowStore((state) => state.setIsExporting);
