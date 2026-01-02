import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { useFlowStore } from '../../store/flowStore';

type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExportFormat = 'png' | 'jpeg';

export const useExport = (canvasId: string = 'canvas-container') => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const setShowExportOverlay = useFlowStore((state) => state.setIsExporting);

  /**
   * Crops an image using canvas API
   */
  const cropImage = async (
    dataUrl: string,
    cropArea: Rectangle
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = dataUrl;

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas size to crop dimensions
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        // Draw the cropped portion
        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );

        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  /**
   * Converts data URL to Blob
   */
  const dataURLtoBlob = async (
    dataURL: string,
    mimeType: string
  ): Promise<Blob> => {
    const response = await fetch(dataURL);
    let blob = await response.blob();

    // Convert to JPEG if needed
    if (mimeType === 'image/jpeg' && blob.type !== 'image/jpeg') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = dataURL;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });
    }

    return blob;
  };

  /**
   * Captures the canvas as an image
   */
  const captureCanvas = async (format: ExportFormat): Promise<string> => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    const options = {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    };

    if (format === 'jpeg') {
      return toJpeg(canvas, { ...options, quality: 0.95 });
    }

    return toPng(canvas, options);
  };

  /**
   * Exports the selected area
   */
  const handleExport = async (selection: Rectangle): Promise<void> => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Capture full canvas
      const fullImage = await captureCanvas(exportFormat);

      // Crop to selection
      const croppedImage = await cropImage(fullImage, selection);

      // Convert to blob with correct format
      const mimeType = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await dataURLtoBlob(croppedImage, mimeType);

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flowchart_export.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close overlay on success
      setShowExportOverlay(false);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Copies the selected area to clipboard
   */
  const handleCopy = async (selection: Rectangle): Promise<void> => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported');
    }

    if (isCopying) return;

    setIsCopying(true);
    try {
      // Capture full canvas
      const fullImage = await captureCanvas(exportFormat);

      // Crop to selection
      const croppedImage = await cropImage(fullImage, selection);

      // Convert to blob
      const mimeType = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await dataURLtoBlob(croppedImage, mimeType);

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [mimeType]: blob,
        }),
      ]);

      // Keep success state for brief moment
      setTimeout(() => {
        setIsCopying(false);
      }, 1500);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      setIsCopying(false);
      throw error;
    }
  };

  /**
   * Close the export overlay
   */
  const handleClose = () => {
    setShowExportOverlay(false);
  };

  return {
    exportFormat,
    setExportFormat,
    isExporting,
    isCopying,
    handleExport,
    handleCopy,
    handleClose,
  };
};