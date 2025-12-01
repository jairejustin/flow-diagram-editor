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

  nodes: [
    {
      id: "node_start",
      shape: "rectangle",
      position: { x: 200, y: 80 },
      width: 140,
      height: 50,
      content: "Start",
      style: {}
    },

    {
      id: "node_input",
      shape: "rectangle",
      position: { x: 200, y: 180 },
      width: 180,
      height: 60,
      content: "Get User Input",
      style: {
        borderRadius: 10
      }
    },

    {
      id: "node_decision",
      shape: "diamond",
      position: { x: 200, y: 300 },
      width: 160,
      height: 100,
      content: "Is Input Valid?",
      style: {
        borderRadius: 10
      }
    },

    {
      id: "node_process",
      shape: "rectangle",
      position: { x: 200, y: 450 },
      width: 200,
      height: 60,
      content: "Process Input",
      style: {
        borderRadius: 10
      }
    },

    {
      id: "node_end",
      shape: "rectangle",
      position: { x: 200, y: 580 },
      width: 140,
      height: 50,
      content: "End",
      style: {}
    }
  ],

  edges: [
    {
      id: "edge_1",
      from: "node_start",
      to: "node_input",
      path: "straight"
    },{
      id: "edge_2",
      from: "node_input",
      to: "node_decision",
      path: "straight"
    },{
      id: "edge_3",
      from: "node_decision",
      to: "node_process",
      label: {text: "Yes", t: 0.5, offset: {x: 10, y: -10}},
      path: "straight"
    },
    {
      id: "edge_4",
      from: "node_process",
      to: "node_end",
      path: "straight"
    },
    {
      id: "edge_5",
      from: "node_decision",
      to: "node_end",
      label: {text: "No", t: 0.5, offset: {x: 10, y: -10}},
      path: "straight"
    }
  ]
}
