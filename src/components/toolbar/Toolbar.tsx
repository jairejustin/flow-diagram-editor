import { useState } from "react";
import { Type, LetterTextIcon, ShapesIcon } from "lucide-react";
import "./Toolbar.css";

export default function Toolbar() {
  return (
    <div className="toolbar">
        <aside>
          <div>
            {/* TO DO */}
            <button className="toolbar__button">
              <Type />
            </button>
            <button className="toolbar__button">
              <LetterTextIcon />
            </button>
            <button className="toolbar__button">
              <ShapesIcon />
            </button>
          </div>
        </aside>
    </div>
  )
}
