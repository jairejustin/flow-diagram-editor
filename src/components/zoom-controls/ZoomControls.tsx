import { Plus, Minus } from "lucide-react";
import "./ZoomControls.css";

interface ZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoomFactor: number;
}

export default function ZoomControls(ZoomControlsProps: ZoomControlsProps) {
  const { 
    onZoomIn, 
    onZoomOut, 
    zoomFactor 
  } = ZoomControlsProps;
  
  return (
    <div className="zoom-controls">
        <p>{Math.round(zoomFactor*100)}%</p>
      <button className="zoom-controls__button" onClick={onZoomIn}>
        <Plus/>
      </button>
      <button className="zoom-controls__button" onClick={onZoomOut}>
        <Minus />
      </button>
    </div>
  );
}
