import type { NodeData, position } from "../../lib/types";
import { useNodeById } from "../../store/flowStore";
import { useNodeDrag } from "./useNodeDrag";

interface UseNodeResult {
  storeNode: NodeData | undefined;
  position: position;
  height: number;
  width: number;
  text: string;
  border: number;
  pad: number;
  onPointerDown: (e: React.PointerEvent) => void;
}

export function useNode(node: NodeData): UseNodeResult {
  const storeNode = useNodeById(node.id);
  const position = storeNode?.position || { x: 0, y: 0 };
  const height = storeNode?.height || 100;
  const width = storeNode?.width || 150;
  const text = storeNode?.content || "";

  const { onPointerDown } = useNodeDrag(node.id, position);

  const border = node.style?.borderWidth || 2;
  const pad = border < 3 ? border / 2 + 2 : border / 5 + 3;

  return {
    storeNode,
    position,
    height,
    width,
    text,
    border,
    pad,
    onPointerDown,
  };
}
