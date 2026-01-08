import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { 
  NodeData,
  position,
  NodeStyle,
  EdgeStyle,
  EdgeData,
  EdgeAnchor,
  EdgeLabel,
  Viewport,
  FlowDocument,
  EdgePathType
} from "../lib/types";
import { createDefaultNode, createDefaultEdge } from "../lib/defaults";
import { getAnchorPoint, createElbowPath } from "../lib/utils";

interface FlowState {
  nodes: NodeData[];
  edges: EdgeData[];
  viewport: Viewport;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  isDraggingNode: boolean;
  isResizingNode: boolean;
  isDraggingEdge: boolean;
  isExporting: boolean;
  isMobile: boolean;
  showPanel: boolean;
  viewMode: boolean;
  
  loadMockData: (mockDoc: FlowDocument) => void;
  
  addNode: (nodeData?: Partial<NodeData>) => string;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  updateNodePosition: (id: string, newPosition: position) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  updateNodeContent: (id: string, content: string) => void;
  updateNodeEditing: (id: string, editing: boolean) => void;
  updateNodeStyles: (id: string, style: Partial<NodeStyle>) => void;
  resetEditingStates: () => void;
  setNodes: (nodes: NodeData[]) => void;
  
  selectEdge: (id: string | null) => void;
  addEdge: (edgeData?: Partial<EdgeData>) => string;
  updateEdgeLabel: (id: string, label: EdgeLabel | undefined) => void;
  deleteEdge: (id: string) => void;
  updateEdgeHead: (id: string, to: string | position, toAnchor?: EdgeAnchor) => void;
  updateEdgeTail: (id: string, from: string | position, fromAnchor?: EdgeAnchor) => void;
  flipEdge: (id: string) => void;
  setEdges: (edges: EdgeData[]) => void;
  updateEdgeStyles: (id: string, style: Partial<EdgeStyle>) => void;
  
  updateEdgeSegmentPosition: (id: string, segmentIndex: number, change: { axis: 'x' | 'y', value: number }) => void;
  convertToStraight: (id: string) => void;
  convertToElbow: (id: string) => void;
  updateEdgePath: (id: string, path: EdgePathType) => void;

  setViewport: (viewport: Viewport) => void;
  setIsDraggingNode: (isDragging: boolean) => void;
  setIsResizingNode: (isResizing: boolean) => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  setShowPanel: (showPanel: boolean) => void;
  setViewMode: (viewMode: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,
      selectedEdgeId: null,
      isDraggingNode: false,
      isResizingNode: false,
      isDraggingEdge: false,
      isExporting: false,
      isMobile: window.matchMedia("(max-width: 500px)").matches,
      showPanel: false,
      viewMode: false,

      loadMockData: (mockDoc: FlowDocument) => {
        const { nodes } = get();
        if (nodes.length === 0) {
          set({
            nodes: mockDoc.nodes.map(node => ({ ...node, editing: false })),
            edges: mockDoc.edges,
            viewport: mockDoc.viewport,
          });
        }
      },

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
          edges: state.edges.filter((edge) => edge.from !== id && edge.to !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
      },

      selectNode: (id) => set({ selectedNodeId: id }),

      // --- 1. UPDATE NODE POSITION (With Full Auto-Routing) ---
      updateNodePosition: (id, newPosition) => {
        set((state) => {
          // A. Update the Node
          const updatedNodes = state.nodes.map((node) =>
            node.id === id ? { ...node, position: newPosition } : node
          );

          // Get the node *after* update so we have the new position
          const movingNode = updatedNodes.find((n) => n.id === id);
          if (!movingNode) return { nodes: updatedNodes };

          // B. Regenerate paths for connected edges
          const updatedEdges = state.edges.map((edge) => {
            // Skip straight edges
            if (edge.path !== "elbow") return edge;
            // Skip unconnected edges
            if (edge.from !== id && edge.to !== id) return edge;

            // Resolve Source Position
            let start = { x: 0, y: 0 };
            const startNode = edge.from === id ? movingNode : state.nodes.find(n => n.id === edge.from);
            if (!startNode || typeof edge.from !== 'string') return edge; // Safety
            start = getAnchorPoint(startNode, edge.fromAnchor || { side: "bottom" });

            // Resolve Target Position
            let end = { x: 0, y: 0 };
            const endNode = edge.to === id ? movingNode : state.nodes.find(n => n.id === edge.to);
            if (!endNode || typeof edge.to !== 'string') return edge; // Safety
            end = getAnchorPoint(endNode, edge.toAnchor || { side: "top" });

            // C. FRESH PATH GENERATION
            // We do not care about the old points. We calculate the "Ideal" path now.
            const newPoints = createElbowPath(
              start, 
              end, 
              edge.fromAnchor?.side || "bottom", 
              edge.toAnchor?.side || "top"
            );

            return { ...edge, points: newPoints };
          });

          return { nodes: updatedNodes, edges: updatedEdges };
        });
      },

      // --- 2. UPDATE NODE DIMENSIONS (With Full Auto-Routing) ---
      updateNodeDimensions: (id, width, height) => {
        set((state) => {
          const updatedNodes = state.nodes.map((node) =>
            node.id === id ? { ...node, width, height } : node
          );

          const movingNode = updatedNodes.find(n => n.id === id);
          if (!movingNode) return { nodes: updatedNodes };

          const updatedEdges = state.edges.map((edge) => {
            if (edge.path !== "elbow") return edge;
            if (edge.from !== id && edge.to !== id) return edge;

            // Resolve Positions
            const startNode = edge.from === id ? movingNode : state.nodes.find(n => n.id === edge.from);
            const endNode = edge.to === id ? movingNode : state.nodes.find(n => n.id === edge.to);
            
            if (!startNode || !endNode || typeof edge.from !== 'string' || typeof edge.to !== 'string') return edge;

            const start = getAnchorPoint(startNode, edge.fromAnchor || { side: "bottom" });
            const end = getAnchorPoint(endNode, edge.toAnchor || { side: "top" });

            // Regenerate Path
            const newPoints = createElbowPath(
              start, 
              end, 
              edge.fromAnchor?.side || "bottom", 
              edge.toAnchor?.side || "top"
            );

            return { ...edge, points: newPoints };
          });

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
          const node = state.nodes.find(n => n.id === id);
          if (!node) return state;
          
          const oldBorderWidth = node.style?.borderWidth || 2;
          const newBorderWidth = style.borderWidth !== undefined ? style.borderWidth : oldBorderWidth;
          const borderDiff = newBorderWidth - oldBorderWidth;
          
          return {
            nodes: state.nodes.map((n) =>
              n.id === id
                ? { 
                    ...n, 
                    style: { ...n.style, ...style },
                    width: n.width + borderDiff,
                    height: n.height + borderDiff
                  }
                : n
            ),
          };
        });
      },

      setNodes: (newNodes) => set({ nodes: newNodes }),

      resetEditingStates: () => {
        set((state) => ({
          nodes: state.nodes.map((node) => ({ ...node, editing: false })),
        }));
      },

      addEdge: (edgeData) => {
        const id = uuidv4();
        const newEdge = createDefaultEdge(id, edgeData);
        set((state) => ({ edges: [...state.edges, newEdge] }));
        return id;
      },

      deleteEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        }));
      },

      selectEdge: (id) => set({ selectedEdgeId: id }),

      // --- 3. UPDATE EDGE HEAD (Target) ---
      updateEdgeHead: (id, to, toAnchor) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id) return edge;
            
            const newEdge = { ...edge, to, toAnchor: toAnchor || edge.toAnchor };

            // If we have an elbow path, regenerate it to fit the new connection
            if (newEdge.path === "elbow") {
              const startNode = state.nodes.find(n => n.id === newEdge.from);
              
              let endPos: position | null = null;
              if (typeof to === 'string') {
                const node = state.nodes.find(n => n.id === to);
                if (node) endPos = getAnchorPoint(node, newEdge.toAnchor || { side: 'top' });
              } else {
                endPos = to; // Dragging to free space
              }

              if (startNode && endPos && typeof newEdge.from === 'string') {
                const startPos = getAnchorPoint(startNode, newEdge.fromAnchor || { side: "bottom" });
                
                // Regenerate
                newEdge.points = createElbowPath(
                  startPos, 
                  endPos, 
                  newEdge.fromAnchor?.side || "bottom", 
                  newEdge.toAnchor?.side || "top"
                );
              }
            }
            return newEdge;
          }),
        }));
      },

      // --- 4. UPDATE EDGE TAIL (Source) ---
      updateEdgeTail: (id, from, fromAnchor) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id) return edge;
            
            const newEdge = { ...edge, from, fromAnchor: fromAnchor || edge.fromAnchor };

            if (newEdge.path === "elbow") {
              const endNode = state.nodes.find(n => n.id === newEdge.to);
              
              let startPos: position | null = null;
              if (typeof from === 'string') {
                const node = state.nodes.find(n => n.id === from);
                if (node) startPos = getAnchorPoint(node, newEdge.fromAnchor || { side: 'bottom' });
              } else {
                startPos = from;
              }

              if (endNode && startPos && typeof newEdge.to === 'string') {
                 const endPos = getAnchorPoint(endNode, newEdge.toAnchor || { side: "top" });
                 
                 // Regenerate
                 newEdge.points = createElbowPath(
                   startPos, 
                   endPos, 
                   newEdge.fromAnchor?.side || "bottom", 
                   newEdge.toAnchor?.side || "top"
                 );
              }
            }
            return newEdge;
          }),
        }));
      },

      flipEdge: (id) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id) return edge;
            // Flip Data
            const from = edge.to as string;
            const to = edge.from as string;
            const fromAnchor = edge.toAnchor;
            const toAnchor = edge.fromAnchor;
            
            // We must regenerate the path because flipping might change the logic 
            // (e.g. Left->Right becomes Right->Left)
            let newPoints = edge.points || [];
            if (edge.path === 'elbow') {
               const startNode = state.nodes.find(n => n.id === from);
               const endNode = state.nodes.find(n => n.id === to);
               if(startNode && endNode) {
                  const s = getAnchorPoint(startNode, fromAnchor || {side:'bottom'});
                  const e = getAnchorPoint(endNode, toAnchor || {side:'top'});
                  newPoints = createElbowPath(s, e, fromAnchor?.side || 'bottom', toAnchor?.side || 'top');
               }
            } else {
               newPoints = newPoints.reverse();
            }

            return {
              ...edge,
              from, to, fromAnchor, toAnchor,
              points: newPoints, 
            };
          }),
        }));
      },

      setEdges: (newEdges) => set({ edges: newEdges }),

      updateEdgeStyles: (id, style) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id ? { ...edge, style: { ...edge.style, ...style } } : edge
          ),
        }));
      },

      updateEdgeLabel: (id, label) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id ? { ...edge, label } : edge
          ),
        }));
      },

      updateEdgeSegmentPosition: (id, segmentIndex, change) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id || !edge.points) return edge;
            const newPoints = [...edge.points];
            const p1Index = segmentIndex;
            const p2Index = segmentIndex + 1;

            if (p2Index >= newPoints.length) return edge;

            if (change.axis === 'x') {
              newPoints[p1Index] = { ...newPoints[p1Index], x: change.value };
              newPoints[p2Index] = { ...newPoints[p2Index], x: change.value };
            } else {
              newPoints[p1Index] = { ...newPoints[p1Index], y: change.value };
              newPoints[p2Index] = { ...newPoints[p2Index], y: change.value };
            }

            return { ...edge, points: newPoints };
          }),
        }));
      },

      convertToStraight: (id) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id ? { ...edge, path: "straight", points: [] } : edge
          ),
        }));
      },

      convertToElbow: (id) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id || edge.path === "elbow") return edge;

            const sourceNode = state.nodes.find((n) => n.id === edge.from);
            const targetNode = state.nodes.find((n) => n.id === edge.to);

            if (
              sourceNode &&
              targetNode &&
              typeof edge.from === "string" &&
              typeof edge.to === "string"
            ) {
              const startSide = edge.fromAnchor?.side || "bottom";
              const endSide = edge.toAnchor?.side || "top";

              const start = getAnchorPoint(sourceNode, { side: startSide });
              const end = getAnchorPoint(targetNode, { side: endSide });

              // Generate the strict path
              const newPoints = createElbowPath(start, end, startSide, endSide);

              return { ...edge, path: "elbow", points: newPoints };
            }
            return { ...edge, path: "elbow", points: [] };
          }),
        }));
      },
      
      updateEdgePath: (id, path) => {
         const { convertToStraight, convertToElbow } = get();
         if(path === 'straight') convertToStraight(id);
         if(path === 'elbow') convertToElbow(id);
      },

      setViewport: (viewport) => set({ viewport }),
      setIsDraggingNode: (isDraggingNode) => set({ isDraggingNode }),
      setIsResizingNode: (isResizingNode) => set({ isResizingNode }),
      setIsDraggingEdge: (isDraggingEdge) => set({ isDraggingEdge }),
      setShowPanel: (showPanel) => set({ showPanel }),
      setViewMode: (viewMode) => set({ viewMode }),
      setIsExporting: (isExporting) => set({ isExporting }),
    }),
    {
      name: "flow-storage",
      partialize: (state) => ({
        nodes: state.nodes.map((node) => ({ ...node, editing: false })),
        edges: state.edges,
        viewport: state.viewport,
      }),
    }
  )
);