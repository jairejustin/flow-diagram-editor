import type { NodeData, EdgeData, NodeStyle, EdgeStyle, Viewport } from "./types";

export const DEFAULT_NODE_CONFIG = {
  width: 200,
  height: 100,
  content: "New Node",
  shape: "rectangle" as const,
  editing: false,
};

export const DEFAULT_NODE_STYLE: Required<NodeStyle> = {
  backgroundColor: "#ffffff",
  borderColor: "#3b82f6",
  borderWidth: 2,
  borderRadius: 8,
  textColor: "#1f2937",
  fontSize: 16,
  fontWeight: "normal",
};

export const DEFAULT_EDGE_CONFIG = {
  path: "straight" as const,
  fromAnchor: { side: "right" as const },
  toAnchor: { side: "left" as const },
};

export const DEFAULT_EDGE_STYLE: Required<EdgeStyle> = {
  color: "#6b7280",
  width: 2,
  dashed: false,
};

export function createDefaultNode(
  id: string,
  viewport: Viewport,
  overrides?: Partial<NodeData>
): NodeData {
  const { x, y, zoom } = viewport;
  const viewportCenterX = -x / zoom + window.innerWidth / 2 / zoom;
  const viewportCenterY = -y / zoom + window.innerHeight / 2 / zoom;

  // Position the node's center at the viewport's center
  const position = {
    x: viewportCenterX - DEFAULT_NODE_CONFIG.width / 2,
    y: viewportCenterY - DEFAULT_NODE_CONFIG.height / 2,
  };

  return {
    id,
    position,
    ...DEFAULT_NODE_CONFIG,
    ...overrides,
    // Merge styles if provided
    style: {
      ...DEFAULT_NODE_STYLE,
      ...(overrides?.style || {}),
    },
  };
}

export function createDefaultEdge(
  id: string,
  overrides?: Partial<EdgeData>
): EdgeData {
  return {
    id,
    from: "",
    to: "",
    ...DEFAULT_EDGE_CONFIG,
    ...overrides,
    // Merge styles if provided
    style: {
      ...DEFAULT_EDGE_STYLE,
      ...(overrides?.style || {}),
    },
  };
}