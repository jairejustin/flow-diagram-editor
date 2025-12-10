import { RgbColorPicker } from 'react-colorful';
import "./ColorPicker.css"
import { rgbToHex, hexToRgb } from '../../lib/utils';

interface ColorPickerProps {
  color: string;
  target: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ color, target, onChange }: ColorPickerProps) {
  const handleColorChange = (rgb: { r: number; g: number; b: number }) => {
    const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange(hexColor);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    //allow typing then validate hex format
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <div className='color-picker'>
      <label>{target}</label>
      <RgbColorPicker
        color={hexToRgb(color)}
        onChange={handleColorChange}
      />
      <input
        type="text"
        value={color.toUpperCase()}
        onChange={handleHexInput}
        placeholder="#000000"
        maxLength={7}
      />
    </div>
  );
}