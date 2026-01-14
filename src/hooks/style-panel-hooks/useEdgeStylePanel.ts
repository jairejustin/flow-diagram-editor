import { useState } from "react";
import { useFlowStore } from "../../store/flowStore";

export function useEdgeStylePanel(id: string) {
  const edge = useFlowStore((state) => state.edges.find((e) => e.id === id));
  const updateEdgeStyles = useFlowStore((state) => state.updateEdgeStyles);
  const updateEdgeLabel = useFlowStore((state) => state.updateEdgeLabel);
  const selectEdge = useFlowStore((state) => state.selectEdge);
  const convertEdgeToStraight = useFlowStore(
    (state) => state.convertToStraight
  );
  const convertEdgeToElbow = useFlowStore((state) => state.convertToElbow);
  const { deleteEdge, flipEdge } = useFlowStore();

  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const edgeWidth = edge?.style?.width || 2;
  const labelText = edge?.label?.text || "";
  const labelPosition = edge?.label?.t || 0.5;
  const labelFontSize = edge?.label?.fontSize || 14;
  const edgePath = edge?.path || "straight";

  const isElbow =
    edgePath === "elbow" || (edge?.points && edge.points.length > 0);

  const openColorPicker = (pickerType: string) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  const handleEdgeStyleChange = (property: string, value: string | number) => {
    updateEdgeStyles(id, { [property]: value });
  };

  const handleLabelToggle = () => {
    const isLabelActive = !!edge?.label;
    if (isLabelActive) {
      updateEdgeLabel(id, undefined);
    } else {
      updateEdgeLabel(id, { text: "", t: 0.5, fontSize: 14 });
    }
  };

  const handleLabelTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const currentLabel = edge?.label;

    if (currentLabel) {
      updateEdgeLabel(id, { ...currentLabel, text: newText });
    } else {
      updateEdgeLabel(id, { text: newText, t: 0.5, fontSize: 14 });
    }
  };

  const handleLabelPositionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const numValue = Number(e.target.value);
    if (isNaN(numValue)) return;

    const clampedValue = Math.max(0, Math.min(1, numValue));
    const currentLabel = edge?.label;

    if (currentLabel) {
      updateEdgeLabel(id, { ...currentLabel, t: clampedValue });
    } else {
      updateEdgeLabel(id, { text: "", t: clampedValue, fontSize: 14 });
    }
  };

  const handleLabelFontSizeChange = (value: number) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    const currentLabel = edge?.label;

    if (currentLabel) {
      updateEdgeLabel(id, { ...currentLabel, fontSize: numValue });
    } else {
      updateEdgeLabel(id, { text: "", t: 0.5, fontSize: numValue });
    }
  };

  const handleEdgeWidthChange = (value: number) => {
    const clampedWidth = Math.max(1, Math.min(10, value));
    updateEdgeStyles(id, { width: clampedWidth });
  };

  const handlePathTypeChange = (pathType: "straight" | "elbow") => {
    if (pathType === "straight") {
      convertEdgeToStraight(id);
    } else {
      convertEdgeToElbow(id);
    }
  };

  const handleDeleteEdge = () => {
    deleteEdge(id);
    selectEdge(null);
  };

  const handleFlipEdge = () => {
    flipEdge(id);
  };

  return {
    edge,
    edgeWidth,
    labelText,
    labelPosition,
    labelFontSize,
    openPicker,
    isElbow,
    openColorPicker,
    handleEdgeStyleChange,
    handleLabelToggle,
    handleLabelTextChange,
    handleLabelPositionChange,
    handleLabelFontSizeChange,
    handleDeleteEdge,
    handleFlipEdge,
    handleEdgeWidthChange,
    handlePathTypeChange,
  };
}
