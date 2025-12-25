import type { NodeData, EdgeAnchor } from "./types";

// NODES AND EDGES

export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine === '' ? word : currentLine + ' ' + word;
    // Estimate text width, this is a simplified approach and might need adjustment
    // A more accurate approach would involve measuring text in an SVG element or canvas
    const testWidth = testLine.length * (fontSize * 0.6); // Roughly estimate width based on average character width

    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

export function getAnchorPoint(node: NodeData, anchor: EdgeAnchor) {
  const { x, y } = node.position;
  const width = node.width;
  const height = node.height;
  const shape = node.shape;

  switch (shape) {
    case "rectangle":
    case "ellipse":
    case "diamond":
      switch (anchor.side) {
        case "top":
          return { x: x + width / 2, y };
        case "bottom":
          return { x: x + width / 2, y: y + height };
        case "left":
          return { x, y: y + height / 2 };
        case "right":
          return { x: x + width, y: y + height / 2 };

        /* v8 ignore next */
        default:
          return { x: x + width / 2, y };
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
// COLOR PICKER

export function hexToRgb(hex: string): { r: number; g: number; b: number }{
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export function rgbToHex (r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('');
};
