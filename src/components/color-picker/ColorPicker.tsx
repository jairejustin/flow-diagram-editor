import { useState, useEffect } from "react";
import { RgbColorPicker } from "react-colorful";
import "./ColorPicker.css";
import { rgbToHex, hexToRgb } from "../../lib/utils";

interface ColorPickerProps {
  color: string;
  target: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({
  color,
  target,
  onChange,
}: ColorPickerProps) {
  const [localColor, setLocalColor] = useState(color);

  // sync local state on external changes
  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const handlePickerChange = (rgb: { r: number; g: number; b: number }) => {
    const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    setLocalColor(hexColor);
  };

  const handlePickerRelease = () => {
    if (localColor !== color) {
      onChange(localColor);
    }
  };

  // updates local state while typing
  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // allow typing valid hex characters
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
      setLocalColor(value);
    }
  };

  // commits to store when user blurs or hits enter
  const commitInput = () => {
    // only commit if it's a full 6-digit hex code
    if (/^#[0-9A-Fa-f]{6}$/i.test(localColor)) {
      onChange(localColor);
    } else {
      setLocalColor(color);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitInput();
      (e.target as HTMLInputElement).blur();
    }
  };

  // validate color
  const pickerValidColor = /^#[0-9A-Fa-f]{6}$/i.test(localColor)
    ? localColor
    : color;

  return (
    <div className="color-picker">
      <label>{target}</label>

      <div onPointerUp={handlePickerRelease}>
        <RgbColorPicker
          color={hexToRgb(pickerValidColor)}
          onChange={handlePickerChange}
        />
      </div>

      <input
        type="text"
        value={localColor.toUpperCase()}
        onChange={handleHexInput}
        onBlur={commitInput}
        onKeyDown={handleKeyDown}
        placeholder="#000000"
        maxLength={7}
      />
    </div>
  );
}
