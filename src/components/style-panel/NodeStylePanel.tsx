import { Square, SquareRoundCorner, Trash2, Copy } from "lucide-react";
import "./StylePanel.css";
import ColorPicker from "../color-picker/ColorPicker";
import { useNodeStylePanel } from "../../hooks/style-panel-hooks/useNodeStylePanel";

interface NodeStylePanelProps {
  id: string;
}

export default function NodeStylePanel({ id }: NodeStylePanelProps) {
  const {
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
  } = useNodeStylePanel(id);

  if (!node) {
    return null;
  }

  const text = node.content;
  const shape = node.shape;
  const textColor = node.style?.textColor || "#000000";
  const backgroundColor = node.style?.backgroundColor || "#ffffff";
  const borderColor = node.style?.borderColor || "#000000";
  const borderRadius = node.style?.borderRadius || 0;

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
            onChange={(e) => handleFontSizeChange(e.target.value)}
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
            onChange={(e) => handleBorderWidthChange(e.target.value)}
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
