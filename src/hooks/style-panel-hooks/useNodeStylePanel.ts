import { useState, useEffect } from "react";
import { useFlowStore } from "../../store/flowStore";

export function useNodeStylePanel(id: string) {
  const node = useFlowStore((state) => state.nodes.find((n) => n.id === id));

  const fontSizeFromStore = node?.style?.fontSize || 14;
  const borderWidthFromStore = node?.style?.borderWidth || 2;

  const [fontSize, setFontSize] = useState<string>(String(fontSizeFromStore));
  const [borderWidth, setBorderWidth] = useState<string>(
    String(borderWidthFromStore)
  );
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const updateNodeStyles = useFlowStore((state) => state.updateNodeStyles);
  const selectNode = useFlowStore((state) => state.selectNode);
  const { addNode, deleteNode } = useFlowStore();

  useEffect(() => {
    setFontSize(String(fontSizeFromStore));
  }, [fontSizeFromStore]);

  useEffect(() => {
    setBorderWidth(String(borderWidthFromStore));
  }, [borderWidthFromStore]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    updateNodeContent(id, newText);
  };

  const handleStyleChange = (property: string, value: string | number) => {
    updateNodeStyles(id, { [property]: value });
  };

  const handleDeleteNode = () => {
    deleteNode(id);
    selectNode(null);
  };

  const handleDuplicateNode = () => {
    if (!node) return;

    const duplicateNodeData = {
      content: node.content,
      width: node.width,
      height: node.height,
      shape: node.shape,
      style: node.style,
      position: {
        x: node.position.x + 20,
        y: node.position.y + 20,
      },
    };

    const newId = addNode(duplicateNodeData);
    selectNode(newId);
  };

  const openColorPicker = (pickerType: string) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  const handleBorderWidthChange = (value: string) => {
    setBorderWidth(value);
    handleStyleChange("borderWidth", value);
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    handleStyleChange("fontSize", value);
  };

  return {
    node,
    fontSize,
    borderWidth,
    openPicker,
    handleTextChange,
    handleStyleChange,
    handleDeleteNode,
    handleDuplicateNode,
    openColorPicker,
    updateNodeEditing,
    handleFontSizeChange,
    handleBorderWidthChange,
  };
}
