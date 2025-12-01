export type Viewport = {
  x: number 
  y: number
  zoom: number
}

export type position = {
  x: number
  y: number
}

// Edge related types

export type EdgePathType = "straight" | "elbow" | string; // add more types as needed

export interface EdgeAnchor {
  side: "top" | "bottom" | "left" | "right"
  offset?: position
}

export interface EdgeLabel {
  text: string
  t: number  
  offset?: position
}

export interface EdgeStyle {
  color?: string
  width?: number
  dashed?: boolean
}


export interface EdgeData {
  id: string
  from: string
  to: string
  path: EdgePathType
  fromAnchor?: EdgeAnchor
  toAnchor?: EdgeAnchor
  label?: EdgeLabel
  style?: EdgeStyle

  // transient
  points?: position[]
}

// Node related types

export type NodeShape =
  | "rectangle"
  | "diamond"
  | "ellipse"
  | string;

export interface NodeStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  textColor?: string
  fontSize?: number
  fontWeight?: string
}

export interface NodeData {
  id: string;
  position: position;
  width: number;
  height: number;
  content: string;
  shape: NodeShape;
  style?: NodeStyle;
  editing?: boolean;
}

// FlowDocument type

export type FlowDocument = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  nodes: NodeData[]
  edges: EdgeData[]
  viewport: Viewport
}


