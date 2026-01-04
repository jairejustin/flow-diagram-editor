import { useState } from "react";
import { useFlowStore } from "../../store/flowStore";

export function useEdgeStylePanel(id: string) {
  const edge = useFlowStore((state) => state.edges.find((e) => e.id === id));

  const edgeWidthFromStore = edge?.style?.width || 2;
  const edgeLabelTextFromStore = edge?.label?.text || "";
  const edgeLabelTFromStore = edge?.label?.t || 0.5;
  const edgeLabelFontSizeFromStore = edge?.label?.fontSize || 14;

  const [edgeWidth, setEdgeWidth] = useState(edgeWidthFromStore);
  const [labelText, setLabelText] = useState<string>(edgeLabelTextFromStore);
  const [labelPosition, setLabelPosition] = useState(edgeLabelTFromStore);
  const [labelFontSize, setLabelFontSize] = useState(edgeLabelFontSizeFromStore);

  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const updateEdgeStyles = useFlowStore((state) => state.updateEdgeStyles);
  const updateEdgeLabel = useFlowStore((state) => state.updateEdgeLabel);
  const selectEdge = useFlowStore((state) => state.selectEdge);
  const { deleteEdge, flipEdge } = useFlowStore();

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
      setLabelText("");
    } else {
      updateEdgeLabel(id, { text: "", t: 0.5, fontSize: 14 });
    }
  };

  const handleLabelTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLabelText(newText);

    const currentLabel = edge?.label;
    if (currentLabel) {
      updateEdgeLabel(id, { ...currentLabel, text: newText });
    } else if (newText) {
      updateEdgeLabel(id, { text: newText, t: 0.5, fontSize: 14 });
    }
  };

  const handleLabelPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLabelPosition(newValue);

    const numValue = Number(newValue);
    const currentLabel = edge?.label;
    if (!isNaN(numValue) && currentLabel) {
      updateEdgeLabel(id, {
        ...currentLabel,
        t: Math.max(0, Math.min(1, numValue)),
      });
    } else if (!isNaN(numValue) && !currentLabel) {
      updateEdgeLabel(id, {
        text: "",
        t: Math.max(0, Math.min(1, numValue)),
        fontSize: 14,
      });
    }
  };

  const handleLabelFontSizeChange = (value: number) => {
    setLabelFontSize(value);
    const numValue = Number(value);
    const currentLabel = edge?.label;
    if (!isNaN(numValue) && currentLabel) {
      updateEdgeLabel(id, {
        ...currentLabel,
        fontSize: numValue,
      });
    } else if (!isNaN(numValue) && !currentLabel) {
      updateEdgeLabel(id, {
        text: "",
        t: 0.5,
        fontSize: numValue,
      });
    }

  };

  const handleDeleteEdge = () => {
    deleteEdge(id);
    selectEdge(null);
  };

  const handleFlipEdge = () => {
    flipEdge(id);
  };

  const handleEdgeWidthChange = (value: number) => {
    setEdgeWidth(value);
    handleEdgeStyleChange("width", Math.max(1, Math.min(10, value)));
  };

  return {
    edge,
    edgeWidth,
    labelText,
    labelPosition,
    labelFontSize,
    openPicker,
    openColorPicker,
    handleEdgeStyleChange,
    handleLabelToggle,
    handleLabelTextChange,
    handleLabelPositionChange,
    handleLabelFontSizeChange,
    handleDeleteEdge,
    handleFlipEdge,
    handleEdgeWidthChange,
  };
}