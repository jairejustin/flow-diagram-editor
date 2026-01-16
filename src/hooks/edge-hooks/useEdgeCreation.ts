import { useRef, useCallback, useEffect } from "react";
import {
  useAddEdge,
  useSelectNode,
  useSelectEdge,
} from "../../store/flowStore";
import type { position } from "../../lib/types";

type EdgeHandle = "n" | "s" | "e" | "w";

export function useEdgeCreation(
  nodeId: string,
  nodePosition: position,
  width: number,
  height: number
) {
  const addEdge = useAddEdge();
  const selectEdge = useSelectEdge();
  const selectNode = useSelectNode();
  const createEdgeRef = useRef<(handle: EdgeHandle) => void>(null);

  useEffect(() => {
    createEdgeRef.current = (handle: EdgeHandle) => {
      const fromAnchor = {
        side:
          handle === "n"
            ? "top"
            : handle === "s"
              ? "bottom"
              : handle === "e"
                ? "right"
                : "left",
      } as const;

      let toPosition: position;
      switch (handle) {
        case "n":
          toPosition = {
            x: nodePosition.x + width / 2,
            y: nodePosition.y - 50,
          };
          break;
        case "s":
          toPosition = {
            x: nodePosition.x + width / 2,
            y: nodePosition.y + height + 50,
          };
          break;
        case "e":
          toPosition = {
            x: nodePosition.x + width + 50,
            y: nodePosition.y + height / 2,
          };
          break;
        case "w":
          toPosition = {
            x: nodePosition.x - 50,
            y: nodePosition.y + height / 2,
          };
          break;
      }

      // Create the edge
      const edgeId = addEdge({
        from: nodeId,
        fromAnchor: fromAnchor,
        to: toPosition,
        toAnchor: { side: "top" },
      });

      selectNode(null);
      selectEdge(edgeId);
    };
  }, [nodeId, nodePosition, width, height, addEdge, selectEdge, selectNode]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent, handle: EdgeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      createEdgeRef.current?.(handle);
    },
    []
  );

  return { onHandlePointerDown };
}
