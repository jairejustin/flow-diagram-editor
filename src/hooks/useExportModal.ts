import { useState, useEffect } from 'react';
import { useFlowStore } from '../store/flowStore';
import { exportCanvas, getCroppedImg } from '../lib/exportUtils';

export type ExportFormat = 'png' | 'jpeg';
type croppedArea = { x: number; y: number; width: number; height: number; };

export const useExportModal = () => {
  const [previewSrc, setPreviewSrc] = useState<string | null >(null);
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<croppedArea | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCropEnabled, setIsCropEnabled] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const showExportModal = useFlowStore((state) => state.isExporting);
  const setShowExportModal = useFlowStore((state) => state.setIsExporting);

  useEffect(() => {
    if (!showExportModal) return;

    setPreviewSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCopySuccess(false);

    const handleGeneratePreview = async () => {
      setLoading(true);
      try {
        const dataUrl = await exportCanvas().generatePreview();
        setPreviewSrc(dataUrl);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      } finally {
        setLoading(false);
      }
    };

    handleGeneratePreview();
  }, [showExportModal]);

  const onCropComplete = (_croppedArea: croppedArea, croppedAreaPixels: croppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getProcessedImage = async (): Promise<string> => {
    let imageToExport = previewSrc;
    if (isCropEnabled && croppedAreaPixels && previewSrc) { 
      imageToExport = await getCroppedImg(
        previewSrc,
        croppedAreaPixels,
        rotation
      );
    }
    if (!imageToExport) {
      throw new Error('No image to export');
    }
    return imageToExport;
  };

  // Handle export
  const handleExport = async () => {

    setIsExporting(true);

    try {
      const imageDataURL = await getProcessedImage();
      const { exportProcessedImage } = exportCanvas();
      
      await exportProcessedImage(imageDataURL, exportFormat);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Copy to clipboard is not supported in your browser');
    }

    setIsCopying(true);
    setCopySuccess(false);

    try {
      const imageDataURL = await getProcessedImage();
      const { copyToClipboard } = exportCanvas();
      
      await copyToClipboard(imageDataURL, exportFormat);
      setCopySuccess(true);

      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      throw error;
    } finally {
      setIsCopying(false);
    }
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleClose = () => {
    setShowExportModal(false);
  };

  return {
    previewSrc,
    loading,
    crop,
    zoom,
    rotation,
    exportFormat,
    isExporting,
    isCopying,
    copySuccess,
    showExportModal,
    isCropEnabled,
    
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
  };
};