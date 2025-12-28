import { useState, useEffect, useRef } from "react";
import { useFlowStore } from "../../store/flowStore";

export function useNodeStylePanel(id: string) {
  const node = useFlowStore((state) => state.nodes.find((n) => n.id === id));
  
  const fontSizeFromStore = node?.style?.fontSize || 14;
  const borderWidthFromStore = node?.style?.borderWidth || 2;

  const [fontSize, setFontSize] = useState<string>(String(fontSizeFromStore));
  const [borderWidth, setBorderWidth] = useState<string>(String(borderWidthFromStore));
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const pendingFontSize = useRef<string | null>(null);
  const pendingBorderWidth = useRef<string | null>(null);

  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const updateNodeStyles = useFlowStore((state) => state.updateNodeStyles);
  const selectNode = useFlowStore((state) => state.selectNode);
  const { addNode, deleteNode } = useFlowStore();

  // Sync local input state from store
// Why ESLint warnings are disabled:
  // This is safe, the focus checks should prevent cascading render loops.

  useEffect(() => {
    setFontSize(String(fontSizeFromStore));
  }, [fontSizeFromStore]);

  useEffect(() => {
    setBorderWidth(String(borderWidthFromStore));
  }, [borderWidthFromStore]);

  // Commit pending changes when component unmounts
  useEffect(() => {
    return () => {
      if (pendingFontSize.current !== null) {
        const numValue = Number(pendingFontSize.current);
        if (!isNaN(numValue)) {
          useFlowStore.getState().updateNodeStyles(id, {
            fontSize: Math.max(8, Math.min(72, numValue)),
          });
        }
      }
      if (pendingBorderWidth.current !== null) {
        const numValue = Number(pendingBorderWidth.current);
        if (!isNaN(numValue)) {
          useFlowStore.getState().updateNodeStyles(id, {
            borderWidth: Math.max(0, Math.min(10, numValue)),
          });
        }
      }
    };
  }, [id]);

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

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    pendingFontSize.current = value;
  };

  const commitFontSize = () => {
    const numValue = Number(fontSize);
    if (!isNaN(numValue)) {
      handleStyleChange("fontSize", Math.max(8, Math.min(72, numValue)));
      pendingFontSize.current = null;
    } else {
      setFontSize(String(fontSizeFromStore));
      pendingFontSize.current = null;
    }
  };

  const handleBorderWidthChange = (value: string) => {
    setBorderWidth(value);
    pendingBorderWidth.current = value;
  };

  const commitBorderWidth = () => {
    const numValue = Number(borderWidth);
    if (!isNaN(numValue)) {
      handleStyleChange("borderWidth", Math.max(0, Math.min(10, numValue)));
      pendingBorderWidth.current = null;
    } else {
      setBorderWidth(String(borderWidthFromStore));
      pendingBorderWidth.current = null;
    }
  };

  const openColorPicker = (pickerType: string) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  return {
    node,
    fontSize,
    borderWidth,
    openPicker,
    pendingFontSize,
    pendingBorderWidth,
    handleTextChange,
    handleStyleChange,
    handleDeleteNode,
    handleDuplicateNode,
    commitFontSize,
    commitBorderWidth,
    openColorPicker,
    updateNodeEditing,
    handleFontSizeChange,
    handleBorderWidthChange
  };}