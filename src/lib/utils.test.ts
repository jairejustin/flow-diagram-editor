import { hexToRgb, rgbToHex, wrapText, getAnchorPoint } from "./utils";
import type { NodeData, EdgeAnchor } from "./types";
import { describe, expect, it } from "vitest";

describe("Color Picker Utilities", () => {
  describe("hexToRgb", () => {
    it("converts hex color to RGB", () => {
      expect(hexToRgb("#ff5733")).toEqual({ r: 255, g: 87, b: 51 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("returns black for invalid hex", () => {
      expect(hexToRgb("invalid")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#12345")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("handles hex without hash prefix", () => {
      expect(hexToRgb("ff5733")).toEqual({ r: 255, g: 87, b: 51 });
    });

    it("handles lowercase and uppercase hex values", () => {
      expect(hexToRgb("#FF5733")).toEqual({ r: 255, g: 87, b: 51 });
      expect(hexToRgb("#aAbBcC")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it("converts common UI colors correctly", () => {
      expect(hexToRgb("#3b82f6")).toEqual({ r: 59, g: 130, b: 246 }); // blue-500
      expect(hexToRgb("#ef4444")).toEqual({ r: 239, g: 68, b: 68 }); // red-500
      expect(hexToRgb("#10b981")).toEqual({ r: 16, g: 185, b: 129 }); // green-500
    });
  });

  describe("rgbToHex", () => {
    it("converts RGB color to hex", () => {
      expect(rgbToHex(255, 87, 51)).toBe("#ff5733");
      expect(rgbToHex(0, 0, 0)).toBe("#000000");
      expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
    });

    it("handles single digit hex values correctly", () => {
      expect(rgbToHex(1, 2, 3)).toBe("#010203");
      expect(rgbToHex(15, 15, 15)).toBe("#0f0f0f");
    });

    it("converts mid-range RGB values", () => {
      expect(rgbToHex(128, 128, 128)).toBe("#808080");
      expect(rgbToHex(170, 187, 204)).toBe("#aabbcc");
    });

    it("converts common UI colors correctly", () => {
      expect(rgbToHex(59, 130, 246)).toBe("#3b82f6"); // blue-500
      expect(rgbToHex(239, 68, 68)).toBe("#ef4444"); // red-500
    });
  });

  describe("hexToRgb and rgbToHex roundtrip", () => {
    it("converts back and forth without loss", () => {
      const original = "#3b82f6";
      const rgb = hexToRgb(original);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      expect(hex).toBe(original);
    });
  });
});

describe("Text Wrapping Utility", () => {
  describe("wrapText", () => {
    it("wraps text correctly based on max width", () => {
      const text = "This is a sample text that needs to be wrapped properly.";
      const maxWidth = 100;
      const fontSize = 14;
      const wrappedLines = wrapText(text, maxWidth, fontSize);

      expect(wrappedLines.length).toBeGreaterThan(1);
      
      const avgCharWidth = fontSize * 0.6;
      wrappedLines.forEach(line => {
        expect(line.length * avgCharWidth).toBeLessThanOrEqual(maxWidth + avgCharWidth);
      });
    });

    it("handles single long words", () => {
      const text = "Supercalifragilisticexpialidocious";
      const maxWidth = 50;
      const fontSize = 14;
      const wrappedLines = wrapText(text, maxWidth, fontSize);

      expect(wrappedLines).toEqual([text]);
    });

    it("returns single line for short text", () => {
      const text = "Hello";
      const maxWidth = 200;
      const fontSize = 14;
      const wrappedLines = wrapText(text, maxWidth, fontSize);

      expect(wrappedLines).toEqual(["Hello"]);
      expect(wrappedLines.length).toBe(1);
    });

    it("handles empty string", () => {
      const text = "";
      const maxWidth = 100;
      const fontSize = 14;
      const wrappedLines = wrapText(text, maxWidth, fontSize);

      expect(wrappedLines).toEqual([""]);
    });

    it("wraps at word boundaries", () => {
      const text = "One Two Three Four Five";
      const maxWidth = 50;
      const fontSize = 12;
      const wrappedLines = wrapText(text, maxWidth, fontSize);

      expect(wrappedLines.length).toBeGreaterThan(1);
      wrappedLines.forEach(line => {
        expect(line.trim()).toBe(line);
      });
    });

    it("handles node content wrapping for typical node widths", () => {
      const nodeContent = "Process customer order and validate payment";
      const nodeWidth = 150;
      const fontSize = 14;
      const wrappedLines = wrapText(nodeContent, nodeWidth - 20, fontSize); // 20px padding

      expect(wrappedLines.length).toBeGreaterThanOrEqual(1);
      expect(wrappedLines.every(line => line.length > 0)).toBe(true);
    });

    it("handles multiple spaces between words", () => {
      const text = "Word1    Word2    Word3";
      const maxWidth = 100;
      const fontSize = 14;
      const wrappedLines = wrapText(text, maxWidth, fontSize);

      expect(wrappedLines.length).toBeGreaterThan(0);
    });

    it("wraps long sentences with different font sizes", () => {
      const text = "This sentence should wrap differently with different font sizes";
      
      const smallFontLines = wrapText(text, 100, 10);
      const largeFontLines = wrapText(text, 100, 20);

      expect(largeFontLines.length).toBeGreaterThanOrEqual(smallFontLines.length);
    });
  });
});

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
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 50, y: 0 });
    });

    it("calculates bottom anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "bottom" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 50, y: 50 });
    });

    it("calculates left anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "left" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 0, y: 25 });
    });

    it("calculates right anchor point", () => {
      const node = createRectangleNode();
      const anchor: EdgeAnchor = { side: "right" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 100, y: 25 });
    });

    it("handles offset positions", () => {
      const node = createRectangleNode(100, 200);
      const anchor: EdgeAnchor = { side: "top" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 150, y: 200 });
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
      
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 50, y: 0 });
      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 50, y: 50 });
      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 25 });
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 25 });
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
      
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 50, y: 0 });
      expect(getAnchorPoint(node, { side: "bottom" })).toEqual({ x: 50, y: 50 });
      expect(getAnchorPoint(node, { side: "left" })).toEqual({ x: 0, y: 25 });
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 100, y: 25 });
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

    it("calculates top anchor with offset", () => {
      const node = createParallelogramNode();
      const offset = 100 * 0.2; // 20
      const anchor: EdgeAnchor = { side: "top" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: (100 + offset) / 2, y: 0 });
    });

    it("calculates bottom anchor with offset", () => {
      const node = createParallelogramNode();
      const offset = 100 * 0.2;
      const anchor: EdgeAnchor = { side: "bottom" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: (100 - offset) / 2, y: 50 });
    });

    it("calculates left anchor with offset", () => {
      const node = createParallelogramNode();
      const offset = 100 * 0.2;
      const anchor: EdgeAnchor = { side: "left" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: offset / 2, y: 25 });
    });

    it("calculates right anchor with offset", () => {
      const node = createParallelogramNode();
      const offset = 100 * 0.2;
      const anchor: EdgeAnchor = { side: "right" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 100 - offset / 2, y: 25 });
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

    it("calculates all anchor points for trapezoid", () => {
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

    it("calculates top anchor point", () => {
      const node = createDocumentNode();
      const anchor: EdgeAnchor = { side: "top" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 50, y: 0 });
    });

    it("calculates bottom anchor with curve depth", () => {
      const node = createDocumentNode();
      const curveDepth = -50 * 0.05;
      const anchor: EdgeAnchor = { side: "bottom" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 50, y: 50 + curveDepth });
    });

    it("calculates left anchor point", () => {
      const node = createDocumentNode();
      const anchor: EdgeAnchor = { side: "left" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 0, y: 25 });
    });

    it("calculates right anchor point", () => {
      const node = createDocumentNode();
      const anchor: EdgeAnchor = { side: "right" };
      expect(getAnchorPoint(node, anchor)).toEqual({ x: 100, y: 25 });
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
      
      expect(getAnchorPoint(smallNode, { side: "top" })).toEqual({ x: 25, y: 0 });
      
      const largeNode: NodeData = {
        id: "large",
        position: { x: 0, y: 0 },
        width: 300,
        height: 150,
        content: "Large",
        shape: "rectangle"
      };
      
      expect(getAnchorPoint(largeNode, { side: "top" })).toEqual({ x: 150, y: 0 });
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
      
      expect(getAnchorPoint(node, { side: "top" })).toEqual({ x: 550, y: 300 });
      expect(getAnchorPoint(node, { side: "right" })).toEqual({ x: 600, y: 325 });
    });

    it("handles node with style properties", () => {
      const styledNode: NodeData = {
        id: "styled",
        position: { x: 0, y: 0 },
        width: 100,
        height: 50,
        content: "Styled Node",
        shape: "rectangle",
        style: {
          backgroundColor: "#3b82f6",
          borderColor: "#1e40af",
          borderWidth: 2,
          textColor: "#ffffff"
        }
      };
      
      // Anchor points should not be affected by style
      expect(getAnchorPoint(styledNode, { side: "top" })).toEqual({ x: 50, y: 0 });
    });
  });
});