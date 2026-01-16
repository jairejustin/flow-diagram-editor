import type { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { FlowState, EdgeSlice } from "../types";
import { createDefaultEdge } from "../../lib/defaults";
import { getAnchorPoint, createElbowPath } from "../../lib/utils";

export const createEdgeSlice: StateCreator<FlowState, [], [], EdgeSlice> = (
  set,
  get
) => ({
  edges: [],
  selectedEdgeId: null,

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
          // Re-calculate elbow path using nodes from NodeSlice
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
});
