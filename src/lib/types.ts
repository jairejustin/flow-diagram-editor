export type Viewport = {
  x: number 
  y: number
  zoom: number
}

export type position = {
  x: number
  y: number
}

type EdgeData = {
  id: string
  from: string
  to: string
  label?: string
  path?: "straight" | "smooth"
}

export type NodeData = {
  id: string
  type: "rectangle" | "diamond" // add more shapes as needed
  position: position;
  width: number
  height: number
  content: string
  style?: NodeStyle
}

export type NodeStyle = {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: 0 | 10;
  textColor?: string
  fontSize?: number
  fontWeight?: "normal" | "bold" | "bolder" | "lighter" | number
}

export type FlowDocument = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  nodes: Record<string, NodeData>
  edges: Record<string, EdgeData>
  viewport: Viewport
}


