import React, { useState, useEffect, useRef } from "react";
import { Square, SquareRoundCorner, Trash2, Copy } from "lucide-react";
import { useFlowStore } from "../../store/flowStore";
import "./StylePanel.css";
import ColorPicker from "../color-picker/ColorPicker";

interface NodeStylePanelProps {
  id: string;
}

export default function NodeStylePanel({ id }: NodeStylePanelProps) {
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const node = useFlowStore((state) => state.nodes.find((n) => n.id === id));

  const fontSizeFromStore = node?.style?.fontSize || 14;
  const borderWidthFromStore = node?.style?.borderWidth || 2;

  const [fontSize, setFontSize] = useState<string>(String(fontSizeFromStore));
  const [borderWidth, setBorderWidth] = useState<string>(
    String(borderWidthFromStore)
  );

  const [isFontSizeFocused, setIsFontSizeFocused] = useState(false);
  const [isBorderWidthFocused, setIsBorderWidthFocused] = useState(false);

  // Store pending values that need to be committed
  const pendingFontSize = useRef<string | null>(null);
  const pendingBorderWidth = useRef<string | null>(null);

  // Sync local input state from store when not focused
  // Why ESLint warnings are disabled:
  // This is safe, the focus checks should prevent infinite loops

  useEffect(() => {
    if (!isFontSizeFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFontSize(String(fontSizeFromStore));
    }
  }, [fontSizeFromStore, isFontSizeFocused]);

  useEffect(() => {
    if (!isBorderWidthFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBorderWidth(String(borderWidthFromStore));
    }
  }, [borderWidthFromStore, isBorderWidthFocused]);

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

  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const updateNodeStyles = useFlowStore((state) => state.updateNodeStyles);
  const selectNode = useFlowStore((state) => state.selectNode);
  const { addNode, deleteNode } = useFlowStore();

  if (!node) {
    return null;
  }

  const text = node.content;
  const shape = node.shape;
  const textColor = node.style?.textColor || "#000000";
  const backgroundColor = node.style?.backgroundColor || "#ffffff";
  const borderColor = node.style?.borderColor || "#000000";
  const borderRadius = node.style?.borderRadius || 0;

  const openColorPicker = (pickerType: string) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    updateNodeContent(node.id, newText);
  };

  const handleStyleChange = (property: string, value: string | number) => {
    updateNodeStyles(node.id, { [property]: value });
  };

  const handleDeleteNode = () => {
    deleteNode(node.id);
    selectNode(null);
  };

  const handleDuplicateNode = () => {
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

  return (
    <div className="style-panel">
      <textarea
        className="style-panel__node-textbox"
        placeholder="Write text"
        value={text}
        onBlur={() => {
          updateNodeEditing(node.id, false);
        }}
        onChange={handleTextChange}
      />

      {/* Text Row */}
      <div className="style-row-compact">
        <label>Text</label>
        <div className="style-row-compact__controls">
          <div
            className="style-input-color"
            style={{ backgroundColor: textColor }}
            onClick={() => openColorPicker("text")}
          />
          <input
            type="number"
            className="style-input-small"
            value={fontSize}
            onFocus={() => setIsFontSizeFocused(true)}
            onChange={(e) => {
              setFontSize(e.target.value);
              pendingFontSize.current = e.target.value;
            }}
            onBlur={() => {
              setIsFontSizeFocused(false);
              commitFontSize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitFontSize();
                e.currentTarget.blur();
              }
            }}
            min="8"
            max="72"
          />
        </div>
      </div>

      {/* Background Row */}
      <div className="style-row-compact">
        <label>Background</label>
        <div className="style-row-compact__controls">
          <div
            className="style-input-color"
            style={{ backgroundColor: backgroundColor }}
            onClick={() => openColorPicker("background")}
          />
        </div>
      </div>

      {/* Border Row */}
      <div className="style-row-compact">
        <label>Border</label>
        <div className="style-row-compact__controls">
          <div
            className="style-input-color"
            style={{ backgroundColor: borderColor }}
            onClick={() => openColorPicker("border")}
          />
          <input
            type="number"
            className="style-input-small"
            value={borderWidth}
            onFocus={() => setIsBorderWidthFocused(true)}
            onChange={(e) => {
              setBorderWidth(e.target.value);
              pendingBorderWidth.current = e.target.value;
            }}
            onBlur={() => {
              setIsBorderWidthFocused(false);
              commitBorderWidth();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitBorderWidth();
                e.currentTarget.blur();
              }
            }}
            min="0"
            max="10"
          />
          {shape === "rectangle" && (
            <div className="border-type-buttons">
              <button
                className={`border-type-btn ${
                  borderRadius === 0 ? "active" : ""
                }`}
                onClick={() => handleStyleChange("borderRadius", 0)}
                title="Square corners"
              >
                <Square size={16} strokeWidth={2} />
              </button>
              <button
                className={`border-type-btn ${
                  borderRadius > 0 ? "active" : ""
                }`}
                onClick={() => handleStyleChange("borderRadius", 10)}
                title="Rounded corners"
              >
                <SquareRoundCorner size={16} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>

      {openPicker === "text" && (
        <ColorPicker
          color={textColor}
          target="Text Color"
          onChange={(color) => handleStyleChange("textColor", color)}
        />
      )}

      {openPicker === "background" && (
        <ColorPicker
          color={backgroundColor}
          target="Background Color"
          onChange={(color) => handleStyleChange("backgroundColor", color)}
        />
      )}

      {openPicker === "border" && (
        <ColorPicker
          color={borderColor}
          target="Border Color"
          onChange={(color) => handleStyleChange("borderColor", color)}
        />
      )}

      <div className="action-buttons">
        <button className="action-button" onClick={handleDeleteNode}>
          <Trash2 />
        </button>
        <button className="action-button" onClick={handleDuplicateNode}>
          <Copy />
        </button>
      </div>
    </div>
  );
}
