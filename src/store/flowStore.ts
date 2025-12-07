import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { 
  NodeData, 
  position, 
  NodeStyle, 
  EdgeData, 
  EdgeAnchor,
  Viewport,
  FlowDocument 
} from "../lib/types";
import { createDefaultNode, createDefaultEdge } from "../lib/defaults";

interface FlowState {
  // Current flow state
  nodes: NodeData[];
  edges: EdgeData[];
  viewport: Viewport;
  selectedNodeId: string | null;
  
  // UI state (not persisted)
  isDraggingNode: boolean;
  isResizingNode: boolean;
  isDraggingEdge: boolean;
  
  // Simple init
  loadMockData: (mockDoc: FlowDocument) => void;
  
  // Node operations
  addNode: (nodeData?: Partial<NodeData>) => string;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  updateNodePosition: (id: string, newPosition: position) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  updateNodeContent: (id: string, content: string) => void;
  updateNodeEditing: (id: string, editing: boolean) => void;
  updateNodeStyles: (id: string, style: Partial<NodeStyle>) => void;
  setNodes: (nodes: NodeData[]) => void;
  
  // Edge operations
  addEdge: (edgeData?: Partial<EdgeData>) => string;
  deleteEdge: (id: string) => void;
  updateEdgeHead: (id: string, to: string | position, toAnchor?: EdgeAnchor) => void;
  setEdges: (edges: EdgeData[]) => void;
  
  // Viewport operations
  setViewport: (viewport: Viewport) => void;
  
  // UI state setters
  setIsDraggingNode: (isDragging: boolean) => void;
  setIsResizingNode: (isResizing: boolean) => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,
      isDraggingNode: false,
      isResizingNode: false,
      isDraggingEdge: false,

      // Load mock data (only if store is empty)
      loadMockData: (mockDoc: FlowDocument) => {
        const { nodes } = get();
        
        // Only load if we have no nodes
        if (nodes.length === 0) {
          set({
            nodes: mockDoc.nodes,
            edges: mockDoc.edges,
            viewport: mockDoc.viewport,
          });
        }
      },

      // Node operations
      addNode: (nodeData) => {
        const id = uuidv4();
        const { viewport } = get();
        const newNode = createDefaultNode(id, viewport, nodeData);

        set((state) => ({
          nodes: [...state.nodes, newNode],
        }));

        return id;
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter((edge) => edge.from !== id && edge.to !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
      },

      selectNode: (id) => set({ selectedNodeId: id }),

      updateNodePosition: (id, newPosition) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, position: newPosition } : node
          ),
        }));
      },

      updateNodeDimensions: (id, width, height) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, width, height } : node
          ),
        }));
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
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id
              ? { ...node, style: { ...node.style, ...style } }
              : node
          ),
        }));
      },

      setNodes: (newNodes) => {
        set({ nodes: newNodes });
      },

      // Edge operations
      addEdge: (edgeData) => {
        const id = uuidv4();
        const newEdge = createDefaultEdge(id, edgeData);

        set((state) => ({
          edges: [...state.edges, newEdge],
        }));

        return id;
      },

      deleteEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
        }));
      },

      updateEdgeHead: (id, to, toAnchor) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id ? { ...edge, to, toAnchor: toAnchor || edge.toAnchor } : edge
          ),
        }));
      },

      setEdges: (newEdges) => {
        set({ edges: newEdges });
      },

      // Viewport operations
      setViewport: (viewport) => {
        set({ viewport });
      },

      // UI state setters
      setIsDraggingNode: (isDraggingNode) => set({ isDraggingNode }),
      setIsResizingNode: (isResizingNode) => set({ isResizingNode }),
      setIsDraggingEdge: (isDraggingEdge) => set({ isDraggingEdge }),
    }),
    {
      name: "flow-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
      }),
    }
  )
);