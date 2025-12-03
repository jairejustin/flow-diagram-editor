import { create } from "zustand";
import type { NodeData, position } from "../lib/types";

interface FlowState {
  nodes: NodeData[];
  selectedNodeId: string | null;
  isDraggingNode: boolean;
  
  selectNode: (id: string | null) => void;
  setIsDraggingNode: (isDragging: boolean) => void;

  updateNodePosition: (id: string, newPosition: position) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  updateNodeContent: (id: string, content: string) => void;
  updateNodeEditing: (id: string, editing: boolean) => void;

  setNodes: (nodes: NodeData[]) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  selectedNodeId: null,
  isDraggingNode: false,

  selectNode: (id) => set({ selectedNodeId: id }),
  setIsDraggingNode: (isDraggingNode) => set({ isDraggingNode }),

  updateNodePosition: (id, newPosition) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node
      ),
    })),

  updateNodeDimensions: (id, width, height) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, width, height } : node
      ),
    })),

  updateNodeContent: (id, content) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, content } : node
      ),
    })),

  updateNodeEditing: (id, editing) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, editing } : node
      ),
    })),

  setNodes: (newNodes) => set({ nodes: newNodes }),
}));
