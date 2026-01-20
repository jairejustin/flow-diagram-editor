import { useState } from "react";
import { toPng, toJpeg } from "html-to-image";
import { useSetIsExporting } from "../../store/flowStore";
import type { Rectangle, ExportFormat } from "../../lib/types";

export const useExport = (canvasId: string = "canvas-container") => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const setShowExportOverlay = useSetIsExporting();

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

        resolve({
          x: selection.x * scaleX,
          y: selection.y * scaleY,
          width: selection.width * scaleX,
          height: selection.height * scaleY,
        });
      };

      image.onerror = () => {
        reject(new Error("Failed to load image for scaling"));
      };
    });
  };

  const cropImage = async (
    dataUrl: string,
    cropArea: Rectangle,
    mimeType: "image/png" | "image/jpeg"
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = dataUrl;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        /* 
        on JPEGs, filling white background first should 
        avoid black artifacts on transparency 
        */
        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(
          image,
          cropArea.x, // Source X
          cropArea.y, // Source Y
          cropArea.width, // Source Width
          cropArea.height, // Source Height
          0, // Destination X
          0, // Destination Y
          cropArea.width, // Destination Width
          cropArea.height // Destination Height
        );

        // Export directly to the requested format
        // 0.95 quality only affects jpeg/webp
        resolve(canvas.toDataURL(mimeType, 0.95));
      };

      image.onerror = () => {
        reject(new Error("Failed to load image for cropping"));
      };
    });
  };

  const dataURLtoBlob = async (dataURL: string): Promise<Blob> => {
    const response = await fetch(dataURL);
    return await response.blob();
  };

  const captureCanvas = async (format: ExportFormat): Promise<string> => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      throw new Error("Canvas element not found");
    }

    const options = {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    };

    if (format === "jpeg") {
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
        throw new Error("Canvas element not found");
      }

      const mimeType = exportFormat === "jpeg" ? "image/jpeg" : "image/png";

      const fullImage = await captureCanvas(exportFormat);

      const scaledSelection = await getScaledSelection(
        selection,
        fullImage,
        canvas
      );

      const croppedImage = await cropImage(
        fullImage,
        scaledSelection,
        mimeType
      );

      const blob = await dataURLtoBlob(croppedImage);

      // download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `flowchart_export.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportOverlay(false);
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async (selection: Rectangle): Promise<void> => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error("Clipboard API not supported");
    }

    if (isCopying) return;

    setIsCopying(true);
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        throw new Error("Canvas element not found");
      }

      const mimeType = exportFormat === "jpeg" ? "image/jpeg" : "image/png";

      const fullImage = await captureCanvas(exportFormat);

      const scaledSelection = await getScaledSelection(
        selection,
        fullImage,
        canvas
      );

      const croppedImage = await cropImage(
        fullImage,
        scaledSelection,
        mimeType
      );

      const blob = await dataURLtoBlob(croppedImage);

      await navigator.clipboard.write([
        new ClipboardItem({
          [mimeType]: blob,
        }),
      ]);

      setTimeout(() => {
        setIsCopying(false);
      }, 1500);
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
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
