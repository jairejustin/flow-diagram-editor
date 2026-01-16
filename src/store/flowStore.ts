import { useCallback } from "react";
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
  EdgePathType,
} from "../lib/types";
import { createDefaultNode, createDefaultEdge } from "../lib/defaults";
import {
  getAnchorPoint,
  createElbowPath,
  refreshConnectedEdges,
} from "../lib/utils";

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

  setViewport: (viewport: Viewport) => void;
  setIsDraggingNode: (isDragging: boolean) => void;
  setIsResizingNode: (isResizing: boolean) => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  setShowPanel: (showPanel: boolean) => void;
  setViewMode: (viewMode: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
}

const useFlowStore = create<FlowState>()(
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
            nodes: mockDoc.nodes.map((node) => ({ ...node, editing: false })),
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
          edges: state.edges.filter(
            (edge) => edge.from !== id && edge.to !== id
          ),
          selectedNodeId:
            state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
      },

      selectNode: (id) => set({ selectedNodeId: id }),

      updateNodePosition: (id, newPosition) => {
        set((state) => {
          const updatedNodes = state.nodes.map((node) =>
            node.id === id ? { ...node, position: newPosition } : node
          );

          const updatedEdges = refreshConnectedEdges(
            id,
            updatedNodes,
            state.edges
          );

          return { nodes: updatedNodes, edges: updatedEdges };
        });
      },

      updateNodeDimensions: (id, width, height) => {
        set((state) => {
          const updatedNodes = state.nodes.map((node) =>
            node.id === id ? { ...node, width, height } : node
          );

          const updatedEdges = refreshConnectedEdges(
            id,
            updatedNodes,
            state.edges
          );

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
            style.borderWidth !== undefined
              ? style.borderWidth
              : oldBorderWidth;
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

          const updatedEdges = refreshConnectedEdges(
            id,
            updatedNodes,
            state.edges
          );

          return { nodes: updatedNodes, edges: updatedEdges };
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
          selectedEdgeId:
            state.selectedEdgeId === id ? null : state.selectedEdgeId,
        }));
      },

      selectEdge: (id) => set({ selectedEdgeId: id }),

      updateEdgeHead: (id, to, toAnchor) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id) return edge;

            const newEdge = {
              ...edge,
              to,
              toAnchor: toAnchor || edge.toAnchor,
            };

            if (newEdge.path === "elbow") {
              let startPos = null;
              if (typeof newEdge.from === "string") {
                const node = state.nodes.find((n) => n.id === newEdge.from);
                if (node) {
                  startPos = getAnchorPoint(
                    node,
                    newEdge.fromAnchor || { side: "bottom" }
                  );
                }
              } else {
                startPos = newEdge.from;
              }

              let endPos = null;
              if (typeof to === "string") {
                const node = state.nodes.find((n) => n.id === to);
                if (node) {
                  endPos = getAnchorPoint(
                    node,
                    newEdge.toAnchor || { side: "top" }
                  );
                }
              } else {
                endPos = to;
              }

              if (startPos && endPos) {
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

      updateEdgeTail: (id, from, fromAnchor) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id !== id) return edge;

            const newEdge = {
              ...edge,
              from,
              fromAnchor: fromAnchor || edge.fromAnchor,
            };

            if (newEdge.path === "elbow") {
              let startPos = null;
              if (typeof from === "string") {
                const node = state.nodes.find((n) => n.id === from);
                if (node) {
                  startPos = getAnchorPoint(
                    node,
                    newEdge.fromAnchor || { side: "bottom" }
                  );
                }
              } else {
                startPos = from;
              }

              let endPos = null;
              if (typeof newEdge.to === "string") {
                const node = state.nodes.find((n) => n.id === newEdge.to);
                if (node) {
                  endPos = getAnchorPoint(
                    node,
                    newEdge.toAnchor || { side: "top" }
                  );
                }
              } else {
                endPos = newEdge.to;
              }

              if (startPos && endPos) {
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
            const from = edge.to as string;
            const to = edge.from as string;
            const fromAnchor = edge.toAnchor;
            const toAnchor = edge.fromAnchor;

            let newPoints = edge.points || [];
            if (edge.path === "elbow") {
              const startNode = state.nodes.find((n) => n.id === from);
              const endNode = state.nodes.find((n) => n.id === to);
              if (startNode && endNode) {
                const s = getAnchorPoint(
                  startNode,
                  fromAnchor || { side: "bottom" }
                );
                const e = getAnchorPoint(endNode, toAnchor || { side: "top" });
                newPoints = createElbowPath(
                  s,
                  e,
                  fromAnchor?.side || "bottom",
                  toAnchor?.side || "top"
                );
              }
            } else {
              newPoints = newPoints.reverse();
            }

            return {
              ...edge,
              from,
              to,
              fromAnchor,
              toAnchor,
              points: newPoints,
            };
          }),
        }));
      },

      setEdges: (newEdges) => set({ edges: newEdges }),

      updateEdgeStyles: (id, style) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id
              ? { ...edge, style: { ...edge.style, ...style } }
              : edge
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

            if (change.axis === "x") {
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

            let start = null;
            const startSide = edge.fromAnchor?.side || "bottom";

            if (typeof edge.from === "string") {
              const sourceNode = state.nodes.find((n) => n.id === edge.from);
              if (sourceNode) {
                start = getAnchorPoint(sourceNode, { side: startSide });
              }
            } else if (edge.from && typeof edge.from === "object") {
              start = edge.from;
            }

            let end = null;
            const endSide = edge.toAnchor?.side || "top";

            if (typeof edge.to === "string") {
              const targetNode = state.nodes.find((n) => n.id === edge.to);
              if (targetNode) {
                end = getAnchorPoint(targetNode, { side: endSide });
              }
            } else if (edge.to && typeof edge.to === "object") {
              end = edge.to;
            }

            if (start && end) {
              const newPoints = createElbowPath(start, end, startSide, endSide);
              return { ...edge, path: "elbow", points: newPoints };
            }

            return { ...edge, path: "elbow", points: [] };
          }),
        }));
      },
      updateEdgePath: (id, path) => {
        const { convertToStraight, convertToElbow } = get();
        if (path === "straight") convertToStraight(id);
        if (path === "elbow") convertToElbow(id);
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

// State Selectors
export const useNodes = () => useFlowStore((state) => state.nodes);
export const useEdges = () => useFlowStore((state) => state.edges);
export const useViewport = () => useFlowStore((state) => state.viewport);
export const useSelectedNodeId = () =>
  useFlowStore((state) => state.selectedNodeId);
export const useSelectedEdgeId = () =>
  useFlowStore((state) => state.selectedEdgeId);
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

// Node Actions
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

// Viewport Actions
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
