import type { NodeData, EdgeAnchor, EdgeData, position } from "./types";
import { STUB_LENGTH } from "./constants";

// --- NODES AND EDGES ---

export const createElbowPath = (
  start: position,
  end: position,
  startSide: string = "bottom",
  endSide: string = "top"
): position[] => {
  // Calculate Initial "Stubs" (The take-off and landing strips)
  const getStub = (p: position, side: string) => {
    switch (side) {
      case "top":
        return { x: p.x, y: p.y - STUB_LENGTH };
      case "bottom":
        return { x: p.x, y: p.y + STUB_LENGTH };
      case "left":
        return { x: p.x - STUB_LENGTH, y: p.y };
      case "right":
        return { x: p.x + STUB_LENGTH, y: p.y };
      default:
        return { x: p.x, y: p.y + STUB_LENGTH };
    }
  };

  const sStub = getStub(start, startSide);
  const eStub = getStub(end, endSide);

  const points: position[] = [sStub];

  // Routing Logic
  const isVerticalStart = ["top", "bottom"].includes(startSide);
  const isVerticalEnd = ["top", "bottom"].includes(endSide);

  // --- CASE A: PARALLEL SIDES (e.g. Left -> Right, Top -> Bottom) ---
  if (isVerticalStart === isVerticalEnd) {
    if (isVerticalStart) {
      // Vertical -> Vertical (Top/Bottom to Top/Bottom)

      // Sub-case: Same Side (Bottom -> Bottom, Top -> Top) -> U-Turn
      if (startSide === endSide) {
        // Push the channel "out" to the furthest point to avoid crossing nodes
        const channelY =
          startSide === "bottom"
            ? Math.max(sStub.y, eStub.y)
            : Math.min(sStub.y, eStub.y);

        points.push({ x: sStub.x, y: channelY }); // Down/Up
        points.push({ x: eStub.x, y: channelY }); // Across
      } else {
        // Sub-case: Opposite Sides (Bottom -> Top) -> Z-Shape
        const midY = (sStub.y + eStub.y) / 2;
        points.push({ x: sStub.x, y: midY });
        points.push({ x: eStub.x, y: midY });
      }
    } else {
      // Horizontal -> Horizontal (Left/Right to Left/Right)

      // Sub-case: Same Side (Left -> Left) -> U-Turn
      if (startSide === endSide) {
        // Push the channel "out" (Left uses Min X, Right uses Max X)
        const channelX =
          startSide === "left"
            ? Math.min(sStub.x, eStub.x)
            : Math.max(sStub.x, eStub.x);

        points.push({ x: channelX, y: sStub.y }); // Out
        points.push({ x: channelX, y: eStub.y }); // Vertical
      } else {
        // Sub-case: Opposite Sides (Right -> Left) -> Z-Shape
        const midX = (sStub.x + eStub.x) / 2;
        points.push({ x: midX, y: sStub.y });
        points.push({ x: midX, y: eStub.y });
      }
    }
  }

  // --- CASE B: ORTHOGONAL SIDES (e.g. Bottom -> Right) ---
  else {
    // We have a "Corner". Ideally, it's just one point (L-shape).
    // But if the target is "behind" us, we need 2 corners (Box/Step shape).

    let corner: position;
    let needsDetour = false;

    if (isVerticalStart) {
      // Start: Bottom/Top. End: Left/Right.
      corner = { x: sStub.x, y: eStub.y };

      // Check for Backtrack / Collision
      if (startSide === "bottom" && eStub.y < sStub.y) needsDetour = true;
      if (startSide === "top" && eStub.y > sStub.y) needsDetour = true;
    } else {
      // Start: Left/Right. End: Top/Bottom.
      corner = { x: eStub.x, y: sStub.y };

      // Check for Backtrack
      if (startSide === "right" && eStub.x < sStub.x) needsDetour = true;
      if (startSide === "left" && eStub.x > sStub.x) needsDetour = true;
    }

    if (needsDetour) {
      // Create a "Box" shape using the End Stub's axis as the safe channel
      if (isVerticalStart) {
        points.push({ x: eStub.x, y: sStub.y });
      } else {
        points.push({ x: sStub.x, y: eStub.y });
      }
    } else {
      // Simple L-shape
      points.push(corner);
    }
  }

  points.push(eStub);
  return points;
};

export const refreshConnectedEdges = (
  changedNodeId: string,
  currentNodes: NodeData[],
  currentEdges: EdgeData[]
): EdgeData[] => {
  return currentEdges.map((edge) => {
    if (edge.path !== "elbow") return edge;
    if (edge.from !== changedNodeId && edge.to !== changedNodeId) return edge;

    let startPos: position | null = null;
    if (typeof edge.from === "string") {
      const node = currentNodes.find((n) => n.id === edge.from);
      if (node)
        startPos = getAnchorPoint(node, edge.fromAnchor || { side: "bottom" });
    } else {
      startPos = edge.from;
    }

    let endPos: position | null = null;
    if (typeof edge.to === "string") {
      const node = currentNodes.find((n) => n.id === edge.to);
      if (node) endPos = getAnchorPoint(node, edge.toAnchor || { side: "top" });
    } else {
      endPos = edge.to;
    }

    if (!startPos || !endPos) return edge;

    const newPoints = createElbowPath(
      startPos,
      endPos,
      edge.fromAnchor?.side || "bottom",
      edge.toAnchor?.side || "top"
    );

    return { ...edge, points: newPoints };
  });
};
// --- ARROWHEADS ---

export function getArrowheadDimensions(edgeWidth: number): {
  width: number;
  height: number;
  refX: number;
  refY: number;
} {
  const clampedWidth = Math.max(1, Math.min(10, edgeWidth));

  const baseSize = 12;
  const scaleFactor = 1;
  const size = baseSize + (clampedWidth - 2) * scaleFactor;

  return {
    width: size,
    height: size,
    refX: size - 0.5,
    refY: size / 2,
  };
}

// --- TEXT WRAPPING ---

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine === "" ? word : currentLine + " " + word;
    // Estimate text width, this is a simplified approach and might need adjustment
    const testWidth = testLine.length * (fontSize * 0.6);

    if (testWidth > maxWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

// --- ANCHOR POINTS ---

export function getAnchorPoint(node: NodeData, anchor: EdgeAnchor) {
  const { x, y } = node.position;
  const width = node.width;
  const height = node.height;
  const shape = node.shape;

  /* The x and y points of these anchor points take the first pixel of 
    the node shape as the origin (top-left corner).
  */
  const verticalOffset = 2;
  const horizontalOffset = 2;

  switch (shape) {
    case "rectangle":
    case "ellipse":
    case "diamond":
      switch (anchor.side) {
        case "top":
          return { x: x + width / 2 + horizontalOffset, y };
        case "bottom":
          return { x: x + width / 2 + horizontalOffset, y: y + height };
        case "left":
          return { x, y: y + height / 2 + verticalOffset };
        case "right":
          return { x: x + width, y: y + height / 2 + verticalOffset };

        /* v8 ignore next */
        default:
          return { x: x + width, y: y + height / 2 + verticalOffset };
      }

    case "parallelogram": {
      const offset = width * 0.2;
      switch (anchor.side) {
        case "top":
          return { x: x + (width + offset) / 2, y };
        case "bottom":
          return { x: x + (width - offset) / 2, y: y + height };
        case "left":
          return { x: x + offset / 2, y: y + height / 2 };
        case "right":
          return { x: x + width - offset / 2, y: y + height / 2 };

        /* v8 ignore next */
        default:
          return { x: x + width / 2, y };
      }
    }

    case "trapezoid": {
      const topOffset = width * 0.2;
      switch (anchor.side) {
        case "top":
          return { x: x + width / 2, y };
        case "bottom":
          return { x: x + width / 2, y: y + height };
        case "left":
          return { x: x + topOffset / 2, y: y + height / 2 };
        case "right":
          return { x: x + width - topOffset / 2, y: y + height / 2 };

        /* v8 ignore next */
        default:
          return { x: x + width / 2, y };
      }
    }

    case "document": {
      // document has a curved bottom that extends down
      const curveDepth = -height * 0.05;
      switch (anchor.side) {
        case "top":
          return { x: x + width / 2, y };
        case "bottom":
          return { x: x + width / 2, y: y + height + curveDepth };
        case "left":
          return { x, y: y + height / 2 };
        case "right":
          return { x: x + width, y: y + height / 2 };

        /* v8 ignore next */
        default:
          return { x: x + width / 2, y };
      }
    }
    /* v8 ignore next */
    default:
      switch (anchor.side) {
        case "top":
          return { x: x + width / 2, y };
        case "bottom":
          return { x: x + width / 2, y: y + height };
        case "left":
          return { x, y: y + height / 2 };
        case "right":
          return { x: x + width, y: y + height / 2 };
        default:
          return { x: x + width / 2, y };
      }
  }
}

// --- COLOR PICKER ---

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}
