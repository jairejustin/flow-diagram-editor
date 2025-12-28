import { useState, useEffect, useRef } from "react";
import { useFlowStore } from "../../store/flowStore";

export function useEdgeStylePanel(id: string) {
  const edge = useFlowStore((state) => state.edges.find((e) => e.id === id));

  const edgeWidthFromStore = edge?.style?.width || 2;
  const edgeLabelTextFromStore = edge?.label?.text || "";
  const edgeLabelTFromStore = edge?.label?.t || 0.5;
  const edgeLabelFontSizeFromStore = edge?.label?.fontSize || 14;

  const [edgeWidth, setEdgeWidth] = useState<string>(String(edgeWidthFromStore));
  const [labelText, setLabelText] = useState<string>(edgeLabelTextFromStore);
  const [labelPosition, setLabelPosition] = useState<string>(String(edgeLabelTFromStore));
  const [labelFontSize, setLabelFontSize] = useState<string>(String(edgeLabelFontSizeFromStore));

  const [isEdgeWidthFocused, setIsEdgeWidthFocused] = useState(false);
  const [isLabelTextFocused, setIsLabelTextFocused] = useState(false);
  const [isLabelPositionFocused, setIsLabelPositionFocused] = useState(false);
  const [isLabelFontSizeFocused, setIsLabelFontSizeFocused] = useState(false);
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const pendingEdgeWidth = useRef<string | null>(null);
  const pendingLabelFontSize = useRef<string | null>(null);

  const updateEdgeStyles = useFlowStore((state) => state.updateEdgeStyles);
  const updateEdgeLabel = useFlowStore((state) => state.updateEdgeLabel);
  const selectEdge = useFlowStore((state) => state.selectEdge);
  const { deleteEdge, flipEdge } = useFlowStore();

  // Sync local input state from store when not focused
  // Why ESLint warnings are disabled:
  // This is safe, the focus checks should prevent cascading render loops.

  useEffect(() => {
    if (!isEdgeWidthFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEdgeWidth(String(edgeWidthFromStore));
    }
  }, [edgeWidthFromStore, isEdgeWidthFocused]);

  useEffect(() => {
    if (!isLabelTextFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabelText(edgeLabelTextFromStore);
    }
  }, [edgeLabelTextFromStore, isLabelTextFocused]);

  useEffect(() => {
    if (!isLabelPositionFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabelPosition(String(edgeLabelTFromStore));
    }
  }, [edgeLabelTFromStore, isLabelPositionFocused]);

  useEffect(() => {
    if (!isLabelFontSizeFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabelFontSize(String(edgeLabelFontSizeFromStore));
    }
  }, [edgeLabelFontSizeFromStore, isLabelFontSizeFocused]);

  // Commit pending changes when component unmounts
  useEffect(() => {
    return () => {
      if (pendingEdgeWidth.current !== null) {
        const numValue = Number(pendingEdgeWidth.current);
        if (!isNaN(numValue)) {
          useFlowStore.getState().updateEdgeStyles(id, {
            width: Math.max(1, Math.min(10, numValue)),
          });
        }
      }
      if (pendingLabelFontSize.current !== null) {
        const numValue = Number(pendingLabelFontSize.current);
        const currentLabel = useFlowStore.getState().edges.find(e => e.id === id)?.label;
        if (!isNaN(numValue) && currentLabel) {
          useFlowStore.getState().updateEdgeLabel(id, {
            ...currentLabel,
            fontSize: Math.max(8, Math.min(72, numValue)),
          });
        }
      }
    };
  }, [id]);

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
    const newValue = e.target.value;
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

  const handleLabelFontSizeChange = (value: string) => {
    setLabelFontSize(value);
    pendingLabelFontSize.current = value;

    const numValue = Number(value);
    const currentLabel = edge?.label;
    if (!isNaN(numValue) && currentLabel) {
      updateEdgeLabel(id, {
        ...currentLabel,
        fontSize: Math.max(8, Math.min(72, numValue)),
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

  const handleEdgeWidthChange = (value: string) => {
    setEdgeWidth(value);
    pendingEdgeWidth.current = value;
  };

  const commitEdgeWidth = () => {
    const numValue = Number(edgeWidth);
    if (!isNaN(numValue)) {
      handleEdgeStyleChange("width", Math.max(1, Math.min(10, numValue)));
      pendingEdgeWidth.current = null;
    } else {
      setEdgeWidth(String(edgeWidthFromStore));
      pendingEdgeWidth.current = null;
    }
  };

  const commitLabelFontSize = () => {
    const numValue = Number(labelFontSize);
    const currentLabel = edge?.label;
    if (!isNaN(numValue) && currentLabel) {
      updateEdgeLabel(id, {
        ...currentLabel,
        fontSize: Math.max(8, Math.min(72, numValue)),
      });
      pendingLabelFontSize.current = null;
    } else {
      setLabelFontSize(String(edgeLabelFontSizeFromStore));
      pendingLabelFontSize.current = null;
    }
  };

  return {
    edge,
    edgeWidth,
    labelText,
    labelPosition,
    labelFontSize,
    isEdgeWidthFocused,
    setIsEdgeWidthFocused,
    isLabelTextFocused,
    setIsLabelTextFocused,
    isLabelPositionFocused,
    setIsLabelPositionFocused,
    isLabelFontSizeFocused,
    setIsLabelFontSizeFocused,
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
    commitEdgeWidth,
    commitLabelFontSize
  };
}