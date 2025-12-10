import { useState } from "react";
import { Type, LetterTextIcon, ShapesIcon, Diamond, Square } from "lucide-react";
import "./Toolbar.css";
import { useFlowStore } from "../../store/flowStore";

export default function Toolbar() {
  const [openCreateNode, setOpenCreateNode] = useState(false);
  const { addNode } = useFlowStore();

  const handleAddRectangle = () => {
    addNode({ shape: "rectangle" });
    setOpenCreateNode(false);
  };

  const handleAddDiamond = () => {
    addNode({ shape: "diamond" });
    setOpenCreateNode(false);
  };

  const toggleOpenCreateNode = () => {
    setOpenCreateNode(prev => !prev);
    };

  return (
    <div className="toolbar">
        <aside>
          <div className="toolbar__main-buttons">
            {/* TO DO */}
            <button className="toolbar__button">
              <Type />
            </button>
            <button className="toolbar__button">
              <LetterTextIcon />
            </button>
            <button className=
            {`toolbar__button ${openCreateNode ? 'active' : ''}`}
            onClick={toggleOpenCreateNode}>
              <ShapesIcon />
            </button>
          </div>
          { openCreateNode &&
          <div className="toolbar__shapes-option"> 
            <button className="toolbar__button" onClick={handleAddRectangle}>
              <Square/>
            </button>
            <button className="toolbar__button" onClick={handleAddDiamond}>
              <Diamond/>
            </button>
          </div>
          }
        </aside>
    </div>
  )
};
