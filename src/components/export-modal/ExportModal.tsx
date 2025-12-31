import { X, Download, Copy } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useExportModal } from '../../hooks/useExportModal';
import './ExportModal.css';

export function ExportModal() {
  const {
    previewSrc,
    loading,
    crop,
    zoom,
    rotation,
    exportFormat,
    isExporting,
    isCopying,
    isCropEnabled,
    copySuccess,
    showExportModal,
    setCrop,
    setZoom,
    setRotation,
    setExportFormat,
    setIsCropEnabled,
    onCropComplete,
    handleExport,
    handleCopyToClipboard,
    handleResetCrop,
    handleClose,
  } = useExportModal();

  if (!showExportModal) return null;

  return (
    <div className="export-modal-overlay" onClick={handleClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal__header">
          <h2>Export Diagram</h2>
          <button className="export-modal__close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="export-modal__content">
          <div className="export-modal__preview">
            <div className="export-modal__preview-container">
              {loading && (
                <div className="export-modal__preview-placeholder">
                  <p>Loading preview...</p>
                </div>
              )}

              {!loading && previewSrc && !isCropEnabled &&(
                <img
                  src={previewSrc}
                  alt="Export preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}
              
              {!loading && previewSrc && isCropEnabled && (
                <Cropper
                  image={previewSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              )}
              
              {!loading && !previewSrc && (
                <div className="export-modal__preview-placeholder">
                  <p>Preview unavailable</p>
                </div>
              )}
            </div>
          </div>

          <div className="export-modal__controls">
            <div className="export-modal__format-selector">
              <label>Format:</label>
              <div className="export-modal__format-options">
                <button
                  className={`export-modal__format-btn ${exportFormat === 'png' ? 'active' : ''}`}
                  onClick={() => setExportFormat('png')}
                >
                  PNG
                </button>
                <button
                  className={`export-modal__format-btn ${exportFormat === 'jpeg' ? 'active' : ''}`}
                  onClick={() => setExportFormat('jpeg')}
                >
                  JPEG
                </button>
              </div>
            </div>

            <div className="export-modal__crop-controls">
              <label>Crop:</label>
              <div className="export-modal__crop-buttons">
                <button 
                  className="export-modal__crop-btn"
                  onClick={handleResetCrop}
                >
                  Reset Crop
                </button>
                <button 
                  className={`export-modal__crop-btn ${isCropEnabled ? 'active' : ''}`}
                  onClick={() => setIsCropEnabled(!isCropEnabled)}
                >
                  {isCropEnabled ? 'Disable Crop' : 'Enable Crop'}
                </button>
              </div>
            </div>

            <div className="export-modal__action-buttons">
              <button
                className="export-modal__copy-btn"
                onClick={handleCopyToClipboard}
                disabled={isCopying || !previewSrc }
              >
                <Copy />
                {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : ''}
              </button>

              <button
                className="export-modal__export-btn"
                onClick={handleExport}
                disabled={isExporting || !previewSrc }
              >
                <Download />
                {isExporting ? 'Exporting...' : `${exportFormat.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}