import React from 'react';
import { useFlowStore } from '../../store/flowStore';
import './StylePanel.css'
import { RgbColorPicker } from 'react-colorful';

interface StylePanelProps {
  nodeId: string;
}

export default function StylePanel({ nodeId }: StylePanelProps) {
  const node = useFlowStore((state) => state.nodes.find(n => n.id === nodeId));
  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const updateNodeStyles = useFlowStore((state) => state.updateNodeStyles);

  if (!node) {
    return null;
  }

  const text = node.content;
  const fontSize = node.style?.fontSize || 14;
  const textColor = node.style?.textColor || '#000000';
  const backgroundColor = node.style?.backgroundColor || '#ffffff';
  const borderColor = node.style?.borderColor || '#000000';
  const borderWidth = node.style?.borderWidth || 1;
  const borderRadius = node.style?.borderRadius || 0;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    updateNodeContent(node.id, newText);
  };

  const handleStyleChange = (property: string, value: string | number) => {
    updateNodeStyles(node.id, { [property]: value });
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

      <div className='style-row'>
        <label>Font size</label>
        <input
          type='number'
          className='style-input'
          value={fontSize}
          onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
          min='8'
          max='72'
        />
      </div>

      <div className='style-row'>
        <label>Text color</label>
        <input
          type='color'
          className='style-input-color'
          value={textColor}
          onChange={(e) => handleStyleChange('textColor', e.target.value)}
        />
      </div>

      <div className='style-row'>
        <label>Background</label>
        <input
          type='color'
          className='style-input-color'
          value={backgroundColor}
          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
        />
      </div>

      <div className='style-row'>
        <label>Border color</label>
        <input
          type='color'
          className='style-input-color'
          value={borderColor}
          onChange={(e) => handleStyleChange('borderColor', e.target.value)}
        />
      </div>

      <div className='style-row'>
        <label>Border width</label>
        <input
          type='number'
          className='style-input'
          value={borderWidth}
          onChange={(e) => handleStyleChange('borderWidth', Number(e.target.value))}
          min='1'
          max='10'
        />
      </div>

      <div className='style-row'>
        <label>Border radius</label>
        <input
          type='number'
          className='style-input'
          value={borderRadius}
          onChange={(e) => handleStyleChange('borderRadius', Number(e.target.value))}
          min='0'
          max='50'
        />
      </div>
    </div>
  );
}
