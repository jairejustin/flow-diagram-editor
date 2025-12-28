import { Trash2, RefreshCw } from "lucide-react";
import "./StylePanel.css";
import ColorPicker from "../color-picker/ColorPicker";
import { useEdgeStylePanel } from "../../hooks/style-panel-hooks/useEdgeStylePanel";

interface EdgeStylePanelProps {
  id: string;
}

export default function EdgeStylePanel({ id }: EdgeStylePanelProps) {
  const {
    edge,
    edgeWidth,
    labelText,
    labelPosition,
    labelFontSize,
    setIsEdgeWidthFocused,
    setIsLabelTextFocused,
    setIsLabelPositionFocused,
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
  } = useEdgeStylePanel(id);

  if (!edge) {
    return null;
  }

  const edgeColor = edge.style?.color || "#000000";
  const isLabelActive = !!edge.label;

  return (
    <div className="style-panel">
      <div className="style-row-compact">
        <label>Color</label>
        <div className="style-row-compact__controls">
          <div
            className="style-input-color"
            style={{ backgroundColor: edgeColor }}
            onClick={() => openColorPicker("edgeColor")}
          />
        </div>
      </div>

      <div className="style-row-compact">
        <label>Width</label>
        <div className="style-row-compact__controls">
          <input
            type="number"
            className="style-input-small"
            value={edgeWidth}
            onFocus={() => setIsEdgeWidthFocused(true)}
            onChange={(e) => handleEdgeWidthChange(e.target.value)}
            onBlur={() => {
              setIsEdgeWidthFocused(false);
              commitEdgeWidth();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitEdgeWidth();
                e.currentTarget.blur();
              }
            }}
            min="1"
            max="10"
          />
        </div>
      </div>

      {/* Label Toggle */}
      <div className="style-row-compact">
        <label>Label</label>
        <div className="style-row-compact__controls">
          <label className="switch">
            <input
              type="checkbox"
              checked={isLabelActive}
              onChange={handleLabelToggle}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {isLabelActive && (
        <>
          {/* Label Text Input */}
          <textarea
            className="style-panel__node-textbox"
            placeholder="Enter label text"
            value={labelText}
            rows={2}
            onFocus={() => setIsLabelTextFocused(true)}
            onChange={handleLabelTextChange}
            onBlur={() => setIsLabelTextFocused(false)}
          />

          {/* Label Font Size */}
          <div className="style-row-compact">
            <label>Font Size</label>
            <div className="style-row-compact__controls">
              <input
                type="number"
                className="style-input-small"
                value={labelFontSize}
                onFocus={() => setIsLabelFontSizeFocused(true)}
                onChange={(e) => handleLabelFontSizeChange(e.target.value)}
                onBlur={() => {
                  setIsLabelFontSizeFocused(false);
                  commitLabelFontSize();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitLabelFontSize();
                    e.currentTarget.blur();
                  }
                }}
                min="8"
                max="72"
              />
            </div>
          </div>

          {/* Label Position Slider */}
          <div className="style-row-compact">
            <label>Position</label>
            <div className="style-row-compact__controls">
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={labelPosition}
                onFocus={() => setIsLabelPositionFocused(true)}
                onChange={handleLabelPositionChange}
                onBlur={() => setIsLabelPositionFocused(false)}
                className="label-position-slider"
              />
              <span className="label-position-value">
                {`${(Number(labelPosition) * 100).toFixed(0)}%`}
              </span>
            </div>
          </div>
        </>
      )}

      {openPicker === "edgeColor" && (
        <ColorPicker
          color={edgeColor}
          target="Edge Color"
          onChange={(color) => handleEdgeStyleChange("color", color)}
        />
      )}

      <div className="action-buttons">
        <button className="action-button" onClick={handleDeleteEdge}>
          <Trash2 />
        </button>
        <button className="action-button" onClick={handleFlipEdge}>
          <RefreshCw />
        </button>
      </div>
    </div>
  );
}