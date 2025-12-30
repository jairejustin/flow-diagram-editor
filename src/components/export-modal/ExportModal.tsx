import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { exportCanvas } from '../../lib/exportUtils';
import './ExportModal.css';

export function ExportModal() {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [, setLoading] = useState(false);

  const [exportFormat, setExportFormat] = useState("png");
  const showExportModal = useFlowStore((state) => state.isExporting);
  const setShowExportModal = useFlowStore((state) => state.setIsExporting);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
  if (!showExportModal) return;
  
  setPreviewSrc(null);
  
  const handleGeneratePreview = async () => {
    setLoading(true);
    try {
      const dataUrl = await exportCanvas().generatePreview();
      setPreviewSrc(dataUrl);
    } finally {
      setLoading(false);
    }
  };
  
  handleGeneratePreview();
}, [showExportModal]);

  const handleExport = async () => {
    const { exportAsPng } = exportCanvas();
    setIsExporting(true);
    
    try {
      if (exportFormat === 'png') {
        await exportAsPng();
      } else {
        throw new Error('This export format is still not supported.');
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setShowExportModal(false);
  };

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
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Export preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
              <div className="export-modal__preview-placeholder">
                <p>Preview</p>
                <small>To be implemented</small>
              </div>
              )}
              
              {/* Crop overlay shell - to be implemented */}
              <div className="export-modal__crop-overlay">
                {/* Crop handles and selection area */}
              </div>
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
                  className={`export-modal__format-btn ${exportFormat === 'svg' ? 'active' : ''}`}
                  onClick={() => setExportFormat('svg')}
                >
                  SVG
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
                <button className="export-modal__crop-btn" disabled>
                  Reset Crop
                </button>
                <button className="export-modal__crop-btn" disabled>
                  Fit to Content
                </button>
              </div>
            </div>

            <button
              className="export-modal__export-btn"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={20} />
              {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}