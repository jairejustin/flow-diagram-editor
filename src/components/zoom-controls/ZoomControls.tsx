import { Plus, Minus, RefreshCcw } from "lucide-react";
import "./ZoomControls.css";

interface ZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoomFactor: number;
  onReset?: () => void;
}

export default function ZoomControls(ZoomControlsProps: ZoomControlsProps) {
  const { onZoomIn, onZoomOut, zoomFactor, onReset } = ZoomControlsProps;

  return (
    <div className="zoom-controls">
      <p>{Math.round(zoomFactor * 100)}%</p>
      <button className="zoom-controls__button" onClick={onZoomIn}>
        <Plus />
      </button>
      <button className="zoom-controls__button" onClick={onZoomOut}>
        <Minus />
      </button>
      <button className="zoom-controls__button" onClick={onReset}>
        <RefreshCcw />
      </button>
    </div>
  );
}
