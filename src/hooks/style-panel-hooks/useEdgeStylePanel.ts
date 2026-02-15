import { useState, useEffect } from "react";
import {
  useConvertToElbow,
  useConvertToStraight,
  useDeleteEdge,
  useEdgeById,
  useFlipEdge,
  useSelectEdge,
  useUpdateEdgeLabel,
  useUpdateEdgeStyles,
} from "../../store/flowStore";

export function useEdgeStylePanel(id: string) {
  const edge = useEdgeById(id);
  const updateEdgeStyles = useUpdateEdgeStyles();
  const updateEdgeLabel = useUpdateEdgeLabel();
  const selectEdge = useSelectEdge();
  const convertEdgeToStraight = useConvertToStraight();
  const convertEdgeToElbow = useConvertToElbow();
  const deleteEdge = useDeleteEdge();
  const flipEdge = useFlipEdge();

  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const [localLabelPosition, setLocalLabelPosition] = useState(
    edge?.label?.t ?? 0.5
  );

  const edgeWidth = edge?.style?.width || 2;
  const labelText = edge?.label?.text || "";
  const labelFontSize = edge?.label?.fontSize || 14;
  const edgePath = edge?.path || "straight";

  const isElbow =
    edgePath === "elbow" || (edge?.points && edge.points.length > 0);

  // Update local state with react effect. this is to account for external changes like when
  // selected edge changes or undo/redo happens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalLabelPosition(edge?.label?.t ?? 0.5);
  }, [edge?.label?.t, id]);

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

  // 1. LOCAL CHANGE: Only updates the UI, does not touch the store/history
  const handleLabelPositionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const numValue = Number(e.target.value);
    if (isNaN(numValue)) return;
    const clampedValue = Math.max(0, Math.min(1, numValue));

    setLocalLabelPosition(clampedValue);
  };

  const handleLabelPositionCommit = () => {
    const currentLabel = edge?.label;
    if (currentLabel) {
      updateEdgeLabel(id, { ...currentLabel, t: localLabelPosition });
    } else {
      updateEdgeLabel(id, { text: "", t: localLabelPosition, fontSize: 14 });
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
    labelPosition: localLabelPosition,
    labelFontSize,
    openPicker,
    isElbow,
    openColorPicker,
    handleEdgeStyleChange,
    handleLabelToggle,
    handleLabelTextChange,
    handleLabelPositionChange,
    handleLabelPositionCommit,
    handleLabelFontSizeChange,
    handleDeleteEdge,
    handleFlipEdge,
    handleEdgeWidthChange,
    handlePathTypeChange,
  };
}
