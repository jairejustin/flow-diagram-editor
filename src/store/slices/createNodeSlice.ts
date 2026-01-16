import type { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { FlowState, NodeSlice } from "../types";
import { createDefaultNode } from "../../lib/defaults";
import { refreshConnectedEdges } from "../../lib/utils";

export const createNodeSlice: StateCreator<FlowState, [], [], NodeSlice> = (
  set,
  get
) => ({
  nodes: [],
  selectedNodeId: null,

  addNode: (nodeData) => {
    const id = uuidv4();
    const { viewport } = get();
    const newNode = createDefaultNode(id, viewport, nodeData);
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return id;
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      // Clean up connected edges
      edges: state.edges.filter((edge) => edge.from !== id && edge.to !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  updateNodePosition: (id, newPosition) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node
      );

      // Accessing edges from EdgeSlice to update connections
      const updatedEdges = refreshConnectedEdges(id, updatedNodes, state.edges);

      return { nodes: updatedNodes, edges: updatedEdges };
    });
  },

  updateNodeDimensions: (id, width, height) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, width, height } : node
      );

      const updatedEdges = refreshConnectedEdges(id, updatedNodes, state.edges);

      return { nodes: updatedNodes, edges: updatedEdges };
    });
  },

  updateNodeContent: (id, content) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, content } : node
      ),
    }));
  },

  updateNodeEditing: (id, editing) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, editing } : node
      ),
    }));
  },

  updateNodeStyles: (id, style) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      if (!node) return state;

      const oldBorderWidth = node.style?.borderWidth || 2;
      const newBorderWidth =
        style.borderWidth !== undefined ? style.borderWidth : oldBorderWidth;
      const borderDiff = newBorderWidth - oldBorderWidth;

      const updatedNodes = state.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, ...style },
              width: n.width + borderDiff,
              height: n.height + borderDiff,
            }
          : n
      );

      const updatedEdges = refreshConnectedEdges(id, updatedNodes, state.edges);

      return { nodes: updatedNodes, edges: updatedEdges };
    });
  },

  resetEditingStates: () => {
    set((state) => ({
      nodes: state.nodes.map((node) => ({ ...node, editing: false })),
    }));
  },

  setNodes: (newNodes) => set({ nodes: newNodes }),
});
