import { X, Download, Copy } from "lucide-react";
import "./ExportOverlay.css";
import { useExportOverlay } from "../../hooks/export-overlay-hooks/useExportOverlay";

export function ExportOverlay() {
  const {
    overlayRef,
    selection,
    buttonPlacement,
    exportFormat,
    setExportFormat,
    isExporting,
    isCopying,
    handleExportClick,
    handleCopyClick,
    handleClose,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSelectionPointerDown,
    handleResizePointerDown,
  } = useExportOverlay();

  return (
    <div
      ref={overlayRef}
      className="export-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="export-overlay__mask" width="100%" height="100%">
        <defs>
          <mask id="selection-mask">
            <rect width="100%" height="100%" fill="white" />
            {selection && (
              <rect
                x={selection.x}
                y={selection.y}
                width={selection.width}
                height={selection.height}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#selection-mask)"
        />
      </svg>

      {selection && selection.width > 0 && selection.height > 0 && (
        <>
          <div
            className="export-overlay__selection"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width - 2,
              height: selection.height - 1,
            }}
            onPointerDown={handleSelectionPointerDown}
          >
            <div
              className="export-overlay__handle export-overlay__handle--nw"
              onPointerDown={(e) => handleResizePointerDown(e, "nw")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--n"
              onPointerDown={(e) => handleResizePointerDown(e, "n")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--ne"
              onPointerDown={(e) => handleResizePointerDown(e, "ne")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--e"
              onPointerDown={(e) => handleResizePointerDown(e, "e")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--se"
              onPointerDown={(e) => handleResizePointerDown(e, "se")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--s"
              onPointerDown={(e) => handleResizePointerDown(e, "s")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--sw"
              onPointerDown={(e) => handleResizePointerDown(e, "sw")}
            />
            <div
              className="export-overlay__handle export-overlay__handle--w"
              onPointerDown={(e) => handleResizePointerDown(e, "w")}
            />

            <div className="export-overlay__dimensions">
              {Math.round(selection.width)} × {Math.round(selection.height)}
            </div>
          </div>

          <div
            className={`export-overlay__toolbar export-overlay__toolbar--${buttonPlacement.position}`}
            style={{
              ...(buttonPlacement.isInside && {
                left: selection.x + selection.width - 8,
                top: selection.y + 8,
                transform: "translateX(-100%)",
              }),
              ...(!buttonPlacement.isInside &&
                buttonPlacement.position === "bottom" && {
                  left: selection.x + selection.width / 2,
                  top: selection.y + selection.height + 12,
                  transform: "translateX(-50%)",
                }),
              ...(!buttonPlacement.isInside &&
                buttonPlacement.position === "top" && {
                  left: selection.x + selection.width / 2,
                  top: selection.y - 12,
                  transform: "translate(-50%, -100%)",
                }),
              ...(!buttonPlacement.isInside &&
                buttonPlacement.position === "right" && {
                  left: selection.x + selection.width + 12,
                  top: selection.y + selection.height / 2,
                  transform: "translateY(-50%)",
                }),
              ...(!buttonPlacement.isInside &&
                buttonPlacement.position === "left" && {
                  left: selection.x - 12,
                  top: selection.y + selection.height / 2,
                  transform: "translate(-100%, -50%)",
                }),
            }}
          >
            <button
              className={`export-overlay__tool-btn ${exportFormat === "png" ? "active" : ""}`}
              onClick={() => setExportFormat("png")}
              title="PNG format"
            >
              PNG
            </button>
            <button
              className={`export-overlay__tool-btn ${exportFormat === "jpeg" ? "active" : ""}`}
              onClick={() => setExportFormat("jpeg")}
              title="JPEG format"
            >
              JPG
            </button>

            <div className="export-overlay__toolbar-separator" />

            <button
              className="export-overlay__tool-btn"
              onClick={handleCopyClick}
              disabled={isCopying}
              title={isCopying ? "Copied!" : "Copy to clipboard"}
            >
              <Copy size={18} />
            </button>

            <button
              className="export-overlay__tool-btn"
              onClick={handleExportClick}
              disabled={isExporting}
              title={isExporting ? "Exporting..." : "Export image"}
            >
              <Download size={18} />
            </button>

            <button
              className="export-overlay__tool-btn export-overlay__tool-btn--danger"
              onClick={handleClose}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </>
      )}

      {!selection && (
        <div className="export-overlay__instructions">
          <p>Click and drag to select an area</p>
          <p className="export-overlay__instructions-hint">
            Press ESC to cancel
          </p>
        </div>
      )}
    </div>
  );
}
