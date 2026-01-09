import { 
  hexToRgb, 
  rgbToHex, 
  wrapText, 
  getAnchorPoint, 
  getArrowheadDimensions, 
  createElbowPath, 
  refreshConnectedEdges 
} from "./utils";
import type { NodeData, EdgeAnchor, EdgeData } from "./types";
import { describe, expect, it } from "vitest";

describe("Arrowhead Dimensions Utility", () => {
  describe("getArrowheadDimensions", () => {
    it("calculates correct dimensions for various edge widths", () => {
      const testCases = [
        // width = 1 -> size 11
        { edgeWidth: 1, expected: { width: 11, height: 11, refX: 10.5, refY: 5.5 } },
        // width = 2 -> size 12
        { edgeWidth: 2, expected: { width: 12, height: 12, refX: 11.5, refY: 6 } },
        // width = 5 -> size 15 (12 + (5-2))
        { edgeWidth: 5, expected: { width: 15, height: 15, refX: 14.5, refY: 7.5 } },
        // width = 10 -> size 20 (12 + (10-2))
        { edgeWidth: 10, expected: { width: 20, height: 20, refX: 19.5, refY: 10 } },
      ];

      testCases.forEach(({ edgeWidth, expected }) => {
        const result = getArrowheadDimensions(edgeWidth);
        expect(result).toEqual(expected);
      });
    });
  });
});

describe("Color Picker Utilities", () => {
  describe("hexToRgb", () => {
    it("converts hex color to RGB", () => {
      expect(hexToRgb("#ff5733")).toEqual({ r: 255, g: 87, b: 51 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("rgbToHex", () => {
    it("converts RGB color to hex", () => {
      expect(rgbToHex(255, 87, 51)).toBe("#ff5733");
    });
  });
});

describe("Text Wrapping Utility", () => {
  describe("wrapText", () => {
    it("wraps text correctly based on max width", () => {
      const text = "This is a sample text that needs to be wrapped properly.";
      const wrappedLines = wrapText(text, 100, 14);
      expect(wrappedLines.length).toBeGreaterThan(1);
    });
  });
});

// --- ORTHOGONAL ROUTING TESTS ---

describe("Orthogonal Routing Utilities", () => {
  describe("createElbowPath", () => {
    const STUB = 20; 
    
    it("creates simple Vertical -> Vertical U-turn (Same Side)", () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 100 };
      const path = createElbowPath(start, end, "bottom", "bottom");
      
      const expectedY = Math.max(start.y + STUB, end.y + STUB); 
      
      expect(path[0]).toEqual({ x: 100, y: 120 }); 
      expect(path[1].y).toEqual(expectedY); 
      expect(path[2].y).toEqual(expectedY); 
      expect(path[path.length-1]).toEqual({ x: 200, y: 120 }); 
    });

    it("creates Vertical -> Vertical Z-Shape (Opposite Sides)", () => {
      const start = { x: 100, y: 100 }; 
      const end = { x: 100, y: 300 };   
      const path = createElbowPath(start, end, "bottom", "top");

      const sStub = { x: 100, y: 120 };
      const eStub = { x: 100, y: 280 };
      const midY = (sStub.y + eStub.y) / 2;

      expect(path).toContainEqual({ x: 100, y: midY });
    });

    it("creates simple L-shape for Orthogonal connection", () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 200 };
      const path = createElbowPath(start, end, "bottom", "left");
      
      expect(path).toContainEqual({ x: 100, y: 200 }); 
    });
  });

  describe("refreshConnectedEdges", () => {
    const mockNodes: NodeData[] = [
      { id: "1", position: { x: 0, y: 0 }, width: 100, height: 100, content: "A", shape: "rectangle" },
      { id: "2", position: { x: 200, y: 0 }, width: 100, height: 100, content: "B", shape: "rectangle" }
    ];

    const mockEdges: EdgeData[] = [
      { 
        id: "e1", 
        from: "1", 
        to: "2", 
        path: "elbow", 
        fromAnchor: { side: "right" }, 
        toAnchor: { side: "left" }, 
        points: [] 
      }
    ];

    it("regenerates points for connected elbow edges", () => {
      const result = refreshConnectedEdges("1", mockNodes, mockEdges);
      const e1 = result.find(e => e.id === "e1");
      
      // 1. Check if Edge exists
      if (!e1) {
        throw new Error("Edge e1 was not found in the result");
      }

      // 2. Check if Points exist (This is the step that was likely missing)
      if (!e1.points) {
        throw new Error("Edge e1 has no points array");
      }

      // 3. Now TypeScript knows 'e1' and 'e1.points' are definitely defined
      expect(e1.points.length).toBeGreaterThan(0); 
      
      // We also know points[0] exists because length > 0, 
      // but strictly speaking, array access can be undefined. 
      // Safe access:
      const firstPoint = e1.points[0];
      if (!firstPoint) throw new Error("First point is missing");

      expect(firstPoint.x).toBeGreaterThan(100); 
});

// --- ANCHOR TESTS ---
// note: the commented lines are for cases where the horizontal and vertical offsets doesn't exist

describe("Anchor Point Utility", () => {
  describe("getAnchorPoint - Rectangle Shape", () => {
    const createRectangleNode = (x = 0, y = 0, width = 100, height = 50): NodeData => ({
      id: "rect-1",
      position: { x, y },
      width,
      height,
      content: "Rectangle",
      shape: "rectangle"
    });

    it("calculates top anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "top" };
      // Rect Top: x + width/2 + 2, y
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 52, y: 0 });
      // expect(getAnchorPoint(node, anchor)).toEqual({ x: 50, y: 0 });
    });

    it("calculates bottom anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "bottom" };
      // Rect Bottom: x + width/2 + 2, y + height
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 52, y: 50 });
      // expect(getAnchorPoint(node, anchor)).toEqual({ x: 50, y: 50 });
    });

    it("calculates left anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "left" };
      // Rect Left: x, y + height/2 + 2
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 0, y: 27 });
      // expect(getAnchorPoint(node, anchor)).toEqual({ x: 0, y: 25 });
    });

    it("calculates right anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "right" };
      // Rect Right: x + width, y + height/2 + 2
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 100, y: 27 });
      // expect(getAnchorPoint(node, anchor)).toEqual({ x: 100, y: 25 });
    });

    it("handles offset positions", () => {
      const node = createRectangleNode(100, 200);
      const anchor: EdgeAnchor = { side: "top" };
      // Top: 100 + 50 + 2, 200
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 152, y: 200 });
      // expect(getAnchorPoint(node, anchor)).toEqual({ x: 150, y: 200 });
    });
  });

  describe("getAnchorPoint - Ellipse Shape", () => {
    const createEllipseNode = (x = 0, y = 0, width = 100, height = 50): NodeData => ({
      id: "ellipse-1",
      position: { x, y },
      width,
      height,
      content: "Ellipse",
      shape: "ellipse"
    });

    it("calculates all anchor points for ellipse", () => {
      const node = createEllipseNode();
      
      // Ellipse shares the same offset logic in your code
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 52, y: 0 });
      // expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 50, y: 0 });

      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 52, y: 50 });
      // expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 50, y: 50 });

      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 27 });
      // expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 25 });

      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 27 });
      // expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 25 });
    });
  });

  describe("getAnchorPoint - Diamond Shape", () => {
    const createDiamondNode = (x = 0, y = 0, width = 100, height = 50): NodeData => ({
      id: "diamond-1",
      position: { x, y },
      width,
      height,
      content: "Decision",
      shape: "diamond"
    });

    it("calculates all anchor points for diamond", () => {
      const node = createDiamondNode();
      
      // Diamond shares the same offset logic in your code
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 52, y: 0 });
      // expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 50, y: 0 });

      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 52, y: 50 });
      // expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 50, y: 50 });

      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 27 });
      // expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 25 });

      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 27 });
      // expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 25 });
    });
  });

  describe("getAnchorPoint - Parallelogram Shape", () => {
    const createParallelogramNode = (x = 0, y = 0, width = 100, height = 50): NodeData => ({
      id: "parallelogram-1",
      position: { x, y },
      width,
      height,
      content: "Input/Output",
      shape: "parallelogram"
    });

    it("calculates anchors (no offset applied in code block)", () => {
      const node = createParallelogramNode();
      const offset = 100 * 0.2; // 20
      
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: (100 + offset) / 2, y: 0 });
      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: (100 - offset) / 2, y: 50 });
      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: offset / 2, y: 25 });
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100 - offset / 2, y: 25 });
    });
  });

  describe("getAnchorPoint - Trapezoid Shape", () => {
    const createTrapezoidNode = (x = 0, y = 0, width = 100, height = 50): NodeData => ({
      id: "trapezoid-1",
      position: { x, y },
      width,
      height,
      content: "Manual Operation",
      shape: "trapezoid"
    });

    it("calculates anchors (no offset applied in code block)", () => {
      const node = createTrapezoidNode();
      const topOffset = 100 * 0.2;
      
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 50, y: 0 });
      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 50, y: 50 });
      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: topOffset / 2, y: 25 });
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100 - topOffset / 2, y: 25 });
    });
  });

  describe("getAnchorPoint - Document Shape", () => {
    const createDocumentNode = (x = 0, y = 0, width = 100, height = 50): NodeData => ({
      id: "doc-1",
      position: { x, y },
      width,
      height,
      content: "Document",
      shape: "document"
    });

    it("calculates anchors (no offset applied in code block)", () => {
      const node = createDocumentNode();
      const curveDepth = -50 * 0.05;
      
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 50, y: 0 });
      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 50, y: 50 + curveDepth });
      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 25 });
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 25 });
    });
  });

  describe("getAnchorPoint - Edge Cases", () => {
    it("handles different node sizes", () => {
      const smallNode: NodeData = {
        id: "small",
        position: { x: 0, y: 0 },
        width: 50,
        height: 30,
        content: "Small",
        shape: "rectangle"
      };
      
      // Small Node (Top): 25 + 2, 0
      expect(getAnchorPoint(smallNode, { side: "top" })).toEqual({ x: 27, y: 0 });
      // expect(getAnchorPoint(smallNode, { side: "top" })).toEqual({ x: 25, y: 0 });
      
      const largeNode: NodeData = {
        id: "large",
        position: { x: 0, y: 0 },
        width: 300,
        height: 150,
        content: "Large",
        shape: "rectangle"
      };
      
      // Large Node (Top): 150 + 2, 0
      expect(getAnchorPoint(largeNode, { side: "top" })).toEqual({ x: 152, y: 0 });
      // expect(getAnchorPoint(largeNode, { side: "top" })).toEqual({ x: 150, y: 0 });
    });

    it("handles nodes at various viewport positions", () => {
      const node: NodeData = {
        id: "positioned",
        position: { x: 500, y: 300 },
        width: 100,
        height: 50,
        content: "Positioned",
        shape: "rectangle"
      };
      
      // Positioned (Top): 500 + 50 + 2, 300
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 552, y: 300 });
      // expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 550, y: 300 });

      // Positioned (Right): 500 + 100, 300 + 25 + 2
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 600, y: 327 });
      // expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 600, y: 325 });
    });

    it("handles node with style properties", () => {
      const styledNode: NodeData = {
        id: "styled",
        position: { x: 0, y: 0 },
        width: 100,
        height: 50,
        content: "Styled Node",
        shape: "rectangle",
        style: { borderWidth: 2 }
      };
      
      // Anchor points include offset (50 + 2, 0)
      expect(getAnchorPoint(styledNode, { side: "top" })).toEqual({ x: 52, y: 0 });
      // expect(getAnchorPoint(styledNode, { side: "top" })).toEqual({ x: 50, y: 0 });
    });
  });
});
})
})