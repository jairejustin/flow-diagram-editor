export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type position = {
  x: number;
  y: number;
};

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ResizeHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | null
  | undefined;
export type ExportFormat = "png" | "jpeg";

export type AlignmentCandidate = {
  endpoint: position;
  myAnchor: EdgeAnchor;
};

// Edge related types

export type EdgePathType = "straight" | "elbow" | string; // add more types as needed

export interface EdgeAnchor {
  side: "top" | "bottom" | "left" | "right" | undefined;
  offset?: position;
}

export interface EdgeLabel {
  text: string;
  t: number;
  fontSize?: number;
}

export interface EdgeStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
}

export interface EdgeData {
  id: string;
  from: string | position;
  to: string | position;
  path: EdgePathType;
  fromAnchor: EdgeAnchor;
  toAnchor: EdgeAnchor;
  label?: EdgeLabel;
  style?: EdgeStyle;

  // transient
  points?: position[];
}

// Node related types

export type NodeShape =
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "parallelogram"
  | "trapezoid"
  | "document";

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  textColor: string;
  fontSize: number;
  fontWeight: string;
}

export interface NodeData {
  id: string;
  position: position;
  width: number;
  height: number;
  content: string;
  shape: NodeShape;
  style: NodeStyle;
}

// FlowDocument type

export type FlowDocument = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  nodes: NodeData[];
  edges: EdgeData[];
  viewport: Viewport;
};
