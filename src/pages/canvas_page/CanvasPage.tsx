import { useState, useRef, useEffect } from "react";
import { Node } from "../../components/node/Node";
import { mockFlowDocument } from "../../assets/MockData";
import Toolbar from "../../components/toolbar/Toolbar";

import "./CanvasPage.css";

export default function CanvasPage() {
  const nodes = Object.values(mockFlowDocument.nodes);

  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsPanning(true);
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isPanning) return;

    const dx = event.clientX - lastMousePos.current.x;
    const dy = event.clientY - lastMousePos.current.y;

    setTranslateX((prev) => prev + dx);
    setTranslateY((prev) => prev + dy);

    lastMousePos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault(); // Prevent default page scrolling

    const scaleFactor = 1.1;
    const newScale = event.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;

    // Limit zoom (TODO: add buttons to control zoom levels)
    if (newScale > 0.1 && newScale < 5) {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const newTranslateX = mouseX - (mouseX - translateX) * (newScale / scale);
      const newTranslateY = mouseY - (mouseY - translateY) * (newScale / scale);

      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      setScale(newScale);
    }
  };

  return (
    <div
      className="canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
        <Toolbar />
        <div
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: '0 0',
            overflow: 'visible',
          }}
        >
          {nodes.map((node) => (
              <Node node={node} />
          ))}
        </div>
    </div>
  );
};