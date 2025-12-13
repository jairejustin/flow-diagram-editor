import React, { useState, useEffect } from 'react';
import { Square, SquareRoundCorner, Trash2, Copy, RefreshCw } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import './StylePanel.css';
import ColorPicker from "../color-picker/ColorPicker"

interface StylePanelProps {
  id: string;
  type: "Node" | "Edge"
}

export default function StylePanel({ id, type }: StylePanelProps) {
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const node = useFlowStore((state) =>
    type === "Node" ? state.nodes.find(n => n.id === id) : null
  );

  const edge = useFlowStore((state) =>
    type === "Edge" ? state.edges.find(e => e.id === id) : null
  );

  const fontSizeFromStore = node?.style?.fontSize || 14;
  const borderWidthFromStore = node?.style?.borderWidth || 2;
  const edgeWidthFromStore = edge?.style?.width || 2;

  const [fontSize, setFontSize] = useState<string>(String(fontSizeFromStore));
  const [borderWidth, setBorderWidth] = useState<string>(String(borderWidthFromStore));
  const [edgeWidth, setEdgeWidth] = useState<string>(String(edgeWidthFromStore));

  useEffect(() => {
    setFontSize(String(fontSizeFromStore));
  }, [fontSizeFromStore]);

  useEffect(() => {
    setBorderWidth(String(borderWidthFromStore));
  }, [borderWidthFromStore]);

  useEffect(() => {
    setEdgeWidth(String(edgeWidthFromStore));
  }, [edgeWidthFromStore]);
  
  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const updateNodeEditing = useFlowStore((state) => state.updateNodeEditing);
  const updateNodeStyles = useFlowStore((state) => state.updateNodeStyles);
  const updateEdgeStyles = useFlowStore((state) => state.updateEdgeStyles);
  const selectNode = useFlowStore((state) => state.selectNode);
  const selectEdge = useFlowStore((state) => state.selectEdge);
  const { addNode, deleteNode, deleteEdge, flipEdge } = useFlowStore();

  const openColorPicker = (pickerType: string) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  //style panel for nodes
  if (type === "Node") {
    if (!node) {
      return null;
    }

    const text = node.content;
    const shape = node.shape;
    const textColor = node.style?.textColor || '#000000';
    const backgroundColor = node.style?.backgroundColor || '#ffffff';
    const borderColor = node.style?.borderColor || '#000000';
    const borderRadius = node.style?.borderRadius || 0;

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
    }

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
    }

    return (
      <div className='style-panel'>
        <textarea
          className='style-panel__node-textbox'
          placeholder='Write text'

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
              onChange={(e) => setFontSize(e.target.value)}
              onBlur={() => {
                const numValue = Number(fontSize);
                if (!isNaN(numValue)) {
                  handleStyleChange('fontSize', Math.max(8, Math.min(72, numValue)));
                } else {
                  setFontSize(String(fontSizeFromStore)); // Revert to stored value if invalid
                }
              }}
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
              onChange={(e) => setBorderWidth(e.target.value)}
              onBlur={() => {
                const numValue = Number(borderWidth);
                if (!isNaN(numValue)) {
                  handleStyleChange('borderWidth', Math.max(0, Math.min(10, numValue)));
                } else {
                  setBorderWidth(String(borderWidthFromStore)); // Revert to stored value if invalid
                }
              }}
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
        
        <div className='action-buttons'>
          <button
            className='action-button'
            onClick={handleDeleteNode}>
            <Trash2/>
          </button>
          <button
            className='action-button'
            onClick={handleDuplicateNode}>
            <Copy />
          </button>
        </div>
      </div>
    );
  }

  //style panel for edges
  if (type === "Edge") {
    if (!edge) {
      return null;
    }

    const edgeColor = edge.style?.color || '#000000';

    const handleEdgeStyleChange = (property: string, value: string | number) => {
      updateEdgeStyles(edge.id, { [property]: value });
    };

    const handleDeleteEdge = () => {
      deleteEdge(edge.id);
      selectEdge(null);
    }

    const handleFlipEdge = () => {
      flipEdge(edge.id);
    }


    return (
      <div className='style-panel'>

        <div className='style-row-compact'>
          <label>Color</label>
          <div className='style-row-compact__controls'>
            <div
              className='style-input-color'
              style={{ backgroundColor: edgeColor }}
              onClick={() => openColorPicker('edgeColor')}
            />
          </div>
        </div>

        <div className='style-row-compact'>
          <label>Width</label>
          <div className='style-row-compact__controls'>
            <input
              type='number'
              className='style-input-small'
              value={edgeWidth}
              onChange={(e) => setEdgeWidth(e.target.value)}
              onBlur={() => {
                const numValue = Number(edgeWidth);
                if (!isNaN(numValue)) {
                  handleEdgeStyleChange('width', Math.max(1, Math.min(10, numValue)));
                } else {
                  setEdgeWidth(String(edgeWidthFromStore)); // Revert to stored value if invalid
                }
              }}
              min='1'
              max='10'
            />
          </div>
        </div>

        {openPicker === 'edgeColor' && (
          <ColorPicker
            color={edgeColor}
            target="Edge Color"
            onChange={(color) => handleEdgeStyleChange('color', color)}
          />
        )}
        
        <div className='action-buttons'>
          <button
            className='action-button'
            onClick={handleDeleteEdge}>
            <Trash2/>
          </button>
          <button
            className='action-button'
            onClick={handleFlipEdge}>
            <RefreshCw/>
          </button>
        </div>
      </div>
    );
  }

  return null;
}