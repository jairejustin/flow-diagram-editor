import React, { useState } from 'react';
import { Square, SquareRoundCorner } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import './StylePanel.css';
import ColorPicker from "../color-picker/ColorPicker"

interface StylePanelProps {
  nodeId: string;
}

export default function StylePanel({ nodeId }: StylePanelProps) {
  const node = useFlowStore((state) => state.nodes.find(n => n.id === nodeId));
  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const updateNodeStyles = useFlowStore((state) => state.updateNodeStyles);
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  
  if (!node) {
    return null;
  }

  const text = node.content;
  const shape = node.shape;
  const fontSize = node.style?.fontSize || 14;
  const textColor = node.style?.textColor || '#000000';
  const backgroundColor = node.style?.backgroundColor || '#ffffff';
  const borderColor = node.style?.borderColor || '#000000';
  const borderWidth = node.style?.borderWidth || 2;
  const borderRadius = node.style?.borderRadius || 0;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    updateNodeContent(node.id, newText);
  };

  const handleStyleChange = (property: string, value: string | number) => {
    updateNodeStyles(node.id, { [property]: value });
  };

  const openColorPicker = (pickerType: string) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  return (
    <div className='style-panel'>
      <textarea
        className='style-panel__node-textbox'
        placeholder='Write text'
        autoFocus
        value={text}
        onBlur={() => {
          updateNodeEditing(node.id, false);
        }}
        onChange={handleTextChange}
      />

      {/* Text Row */}
      <div className='style-row-compact'>
        <label>Text</label>
        <div className='style-row-compact__controls'>
          <div
            className='style-input-color'
            style={{ backgroundColor: textColor }}
            onClick={() => openColorPicker('text')}
          />
          <input
            type='number'
            className='style-input-small'
            value={fontSize}
            onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
            min='8'
            max='72'
          />
        </div>
      </div>

      {/* Background Row */}
      <div className='style-row-compact'>
        <label>Background</label>
        <div className='style-row-compact__controls'>
          <div
            className='style-input-color'
            style={{ backgroundColor: backgroundColor }}
            onClick={() => openColorPicker('background')}
          />
        </div>
      </div>

      {/* Border Row */}
      <div className='style-row-compact'>
        <label>Border</label>
        <div className='style-row-compact__controls'>
          <div
            className='style-input-color'
            style={{ backgroundColor: borderColor }}
            onClick={() => openColorPicker('border')}
          />
          <input
            type='number'
            className='style-input-small'
            value={borderWidth}
            onChange={(e) => handleStyleChange('borderWidth', Number(e.target.value))}
            min='0'
            max='10'
          />
          {shape === 'rectangle' && (
            <div className='border-type-buttons'>
              <button
                className={`border-type-btn ${borderRadius === 0 ? 'active' : ''}`}
                onClick={() => handleStyleChange('borderRadius', 0)}
                title='Square corners'
              >
                <Square size={16} strokeWidth={2} />
              </button>
              <button
                className={`border-type-btn ${borderRadius > 0 ? 'active' : ''}`}
                onClick={() => handleStyleChange('borderRadius', 10)}
                title='Rounded corners'
              >
                <SquareRoundCorner size={16} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>

      {openPicker === 'text' && (
        <ColorPicker
          color={textColor}
          target="Text Color"
          onChange={(color) => handleStyleChange('textColor', color)}
        />
      )}

      {openPicker === 'background' && (
        <ColorPicker
          color={backgroundColor}
          target="Background Color"
          onChange={(color) => handleStyleChange('backgroundColor', color)}
        />
      )}

      {openPicker === 'border' && (
        <ColorPicker
          color={borderColor}
          target="Border Color"
          onChange={(color) => handleStyleChange('borderColor', color)}
        />
      )}
    </div>
  );
}