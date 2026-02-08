import { useEffect, useState } from "react";
import {
  useDeleteEdge,
  useDeleteNode,
  useSelectedEdgeId,
  useSelectedNodeId,
  useHistory,
  useAddNode,
  useFlowStore,
} from "../../store/flowStore";
import type { NodeData } from "../../lib/types";

export function useKeyboardShortcuts() {
  const [clipboard, setClipboard] = useState<NodeData | null>(null);

  const selectedNodeId = useSelectedNodeId();
  const selectedEdgeId = useSelectedEdgeId();
  const deleteEdge = useDeleteEdge();
  const deleteNode = useDeleteNode();
  const addNode = useAddNode();

  const { undo, redo, canUndo, canRedo } = useHistory();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      switch (e.key) {
        // DELETE (Delete or Backspace)
        case "Delete":
        case "Backspace":
          if (selectedNodeId) {
            deleteNode(selectedNodeId);
          }
          if (selectedEdgeId) {
            deleteEdge(selectedEdgeId);
          }
          break;

        // UNDO (Ctrl + Z)
        case "z":
          if (isCtrlOrCmd) {
            if (e.shiftKey) {
              if (canRedo) redo();
            } else {
              if (canUndo) undo();
            }
            e.preventDefault();
          }
          break;

        // REDO (Ctrl + Y)
        case "y":
          if (isCtrlOrCmd) {
            if (canRedo) redo();
            e.preventDefault();
          }
          break;

        // COPY (Ctrl + C)
        case "c":
          if (isCtrlOrCmd && selectedNodeId) {
            const { nodes } = useFlowStore.getState();
            const nodeToCopy = nodes.find((n) => n.id === selectedNodeId);

            if (nodeToCopy) {
              setClipboard(nodeToCopy);
              // TODO: toast notif
            }
            e.preventDefault();
          }
          break;

        // PASTE (Ctrl + V)
        case "v":
          if (isCtrlOrCmd && clipboard) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, position, ...NodeContent } = clipboard;
            const newNodeData = { ...NodeContent };

            addNode(newNodeData);
            e.preventDefault();
          }
          break;

        // CUT (Ctrl + X)
        case "x":
          if (isCtrlOrCmd && selectedNodeId) {
            const { nodes } = useFlowStore.getState();
            const nodeToCut = nodes.find((n) => n.id === selectedNodeId);

            if (nodeToCut) {
              setClipboard(nodeToCut);
              deleteNode(selectedNodeId);
              // TODO: toast notif
            }
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    addNode,
    clipboard,
    setClipboard,
    selectedEdgeId,
    selectedNodeId,
    deleteNode,
    deleteEdge,
    undo,
    redo,
    canRedo,
    canUndo,
  ]);
}
