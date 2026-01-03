import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { useFlowStore } from '../store/flowStore';
import type { Rectangle, ExportFormat } from '../lib/types';

export const useExport = (canvasId: string = 'canvas-container') => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const setShowExportOverlay = useFlowStore((state) => state.setIsExporting);

  const getScaledSelection = async (
    selection: Rectangle,
    imageDataUrl: string,
    canvasElement: HTMLElement
  ): Promise<Rectangle> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageDataUrl;

      image.onload = () => {
        const rect = canvasElement.getBoundingClientRect();
        
        const scaleX = image.width / rect.width;
        const scaleY = image.height / rect.height;

        console.log('Scale factors:', { scaleX, scaleY });
        console.log('Screen selection:', selection);
        console.log('Image dimensions:', { width: image.width, height: image.height });
        console.log('Screen dimensions:', { width: rect.width, height: rect.height });

        const scaledSelection = {
          x: selection.x * scaleX,
          y: selection.y * scaleY,
          width: selection.width * scaleX,
          height: selection.height * scaleY,
        };

        console.log('Scaled selection:', scaledSelection);

        resolve(scaledSelection);
      };

      image.onerror = () => {
        reject(new Error('Failed to load image for scaling'));
      };
    });
  };

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

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
          image,
          cropArea.x,      // Source X
          cropArea.y,      // Source Y
          cropArea.width,  // Source Width
          cropArea.height, // Source Height
          0,               // Destination X
          0,               // Destination Y
          cropArea.width,  // Destination Width
          cropArea.height  // Destination Height
        );

        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
      };
    });
  };

  const dataURLtoBlob = async (
    dataURL: string,
    mimeType: string
  ): Promise<Blob> => {
    const response = await fetch(dataURL);
    let blob = await response.blob();

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

  const handleExport = async (selection: Rectangle): Promise<void> => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      // Capture and convert
      const fullImage = await captureCanvas(exportFormat);
      const scaledSelection = await getScaledSelection(selection, fullImage, canvas);
      const croppedImage = await cropImage(fullImage, scaledSelection);
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

      // Clean up
      setShowExportOverlay(false);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async (selection: Rectangle): Promise<void> => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported');
    }

    if (isCopying) return;

    setIsCopying(true);
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      // Capture and convert
      const fullImage = await captureCanvas(exportFormat);
      const scaledSelection = await getScaledSelection(selection, fullImage, canvas);
      const croppedImage = await cropImage(fullImage, scaledSelection);
      const mimeType = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await dataURLtoBlob(croppedImage, mimeType);

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [mimeType]: blob,
        }),
      ]);

      setTimeout(() => {
        setIsCopying(false);
      }, 1500);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      setIsCopying(false);
      throw error;
    }
  };

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