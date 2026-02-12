import { Plus, Minus, RefreshCcw } from "lucide-react";
import "./ViewportControls.css";

interface ViewportControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoomFactor: number;
  onReset?: () => void;
}

export const ViewportControls = (
  ViewportControlsProps: ViewportControlsProps
) => {
  const { onZoomIn, onZoomOut, zoomFactor, onReset } = ViewportControlsProps;

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
};
