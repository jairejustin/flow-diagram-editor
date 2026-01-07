import type { NodeData, position } from "../../lib/types";
import { useFlowStore } from "../../store/flowStore";
import { useNodeDrag } from "./useNodeDrag";

interface UseNodeResult {
  storeNode: NodeData | undefined;
  position: position;
  height: number;
  width: number;
  editing: boolean;
  text: string;
  border: number;
  pad: number;
  onPointerDown: (e: React.PointerEvent) => void;
}

export function useNode(node: NodeData): UseNodeResult {
  const storeNode = useFlowStore((state) => state.nodes.find((n) => n.id === node.id));

  const position = storeNode?.position || { x: 0, y: 0 };
  const height = storeNode?.height || 100;
  const width = storeNode?.width || 150;
  const editing = storeNode?.editing || false;
  const text = storeNode?.content || "";

  const { onPointerDown } = useNodeDrag(node.id, position, editing);

  const border = node.style?.borderWidth || 2;
  const pad = (border < 3) ? (border / 2) + 2 : (border / 5) + 3;

  return {
    storeNode,
    position,
    height,
    width,
    editing,
    text,
    border,
    pad,
    onPointerDown
  };
}