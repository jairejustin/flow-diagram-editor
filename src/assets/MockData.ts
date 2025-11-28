import type { FlowDocument } from "../lib/types";

export const mockFlowDocument: FlowDocument = {
  id: "doc_001",
  title: "Sample Flowchart",
  createdAt: 1732600000000,
  updatedAt: 1732600500000,

  viewport: {
    x: 0,
    y: 0,
    zoom: 1
  },

  nodes: {
    "node_start": {
      id: "node_start",
      type: "rectangle",
      position: { x: 200, y: 80 },
      width: 140,
      height: 50,
      content: "Start",
      style: {}
    },

    "node_input": {
      id: "node_input",
      type: "rectangle",
      position: { x: 200, y: 180 },
      width: 180,
      height: 60,
      content: "Get User Input",
      style: {
        borderRadius: 10
      }
    },

    "node_decision": {
      id: "node_decision",
      type: "diamond",
      position: { x: 200, y: 300 },
      width: 160,
      height: 100,
      content: "Is Input Valid?",
      style: {
        borderRadius: 10
      }
    },

    "node_process": {
      id: "node_process",
      type: "rectangle",
      position: { x: 200, y: 450 },
      width: 200,
      height: 60,
      content: "Process Input",
      style: {
        borderRadius: 10
      }
    },

    "node_end": {
      id: "node_end",
      type: "rectangle",
      position: { x: 200, y: 580 },
      width: 140,
      height: 50,
      content: "End",
      style: {}
    }
  },

  edges: {
    "edge_1": {
      id: "edge_1",
      from: "node_start",
      to: "node_input",
      path: "straight"
    },
    "edge_2": {
      id: "edge_2",
      from: "node_input",
      to: "node_decision",
      path: "straight"
    },
    "edge_3": {
      id: "edge_3",
      from: "node_decision",
      to: "node_process",
      label: "Yes",
      path: "straight"
    },
    "edge_4": {
      id: "edge_4",
      from: "node_process",
      to: "node_end",
      path: "straight"
    },
    "edge_5": {
      id: "edge_5",
      from: "node_decision",
      to: "node_end",
      label: "No",
      path: "straight"
    }
  }
}
