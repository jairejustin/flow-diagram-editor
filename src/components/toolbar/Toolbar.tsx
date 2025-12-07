import { useState } from "react";
import { Type, LetterTextIcon, ShapesIcon, Diamond, Square } from "lucide-react";
import "./Toolbar.css";

export default function Toolbar() {
  const [openCreateNode, setOpenCreateNode] = useState(false);
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
            onClick={()=>{openCreateNode ?
            setOpenCreateNode(false) :
            setOpenCreateNode(true);
            }}>
              <ShapesIcon />
            </button>
          </div>
          { openCreateNode &&
          <div className="toolbar__shapes-option"> 
            <button className="toolbar__button">
              <Square/>
            </button>
            <button className="toolbar__button">
              <Diamond/>
            </button>
          </div>
          }
        </aside>
    </div>
  )
}
