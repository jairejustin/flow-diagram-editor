import { toPng, toJpeg } from 'html-to-image';
import download from 'downloadjs';

// Helper function to get cropped image
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
  );

  return canvas.toDataURL('image/png');
};

// Helper function to convert dataURL to blob
export const dataURLtoBlob = async (dataURL: string, mimeType: string): Promise<Blob> => {
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

export const exportCanvas = () => {
  const name = 'flowchart_export';

  const generatePreview = async () => {
    const canvas = document.getElementById('canvas-container');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    try {
      const dataUrl = await toJpeg(canvas, {
        quality: 0.8,
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: '#ffffff',
      });
      return dataUrl;
    } catch (err) {
      console.error('something went wrong...', err);
      throw err;
    }
  };

  const exportAsPng = async () => {
    try {
      const canvas = document.getElementById('canvas-container');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      console.log('Starting export...');
      const dataUrl = await toPng(canvas, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      console.log('Image generated, downloading...');
      download(dataUrl, `${name}.png`);
      console.log('Download initiated');
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const exportToJpeg = async () => {
    try {
      const canvas = document.getElementById('canvas-container');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      console.log('Starting export to JPEG...');
      const dataUrl = await toJpeg(canvas, {
        quality: 0.95,
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      console.log('JPEG image generated, downloading...');
      download(dataUrl, `${name}.jpeg`);
      console.log('Download initiated');
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const exportProcessedImage = async (
    imageDataURL: string,
    format: 'png' | 'jpeg',
    filename: string = name
  ) => {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await dataURLtoBlob(imageDataURL, mimeType);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (
    imageDataURL: string,
    format: 'png' | 'jpeg'
  ) => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported');
    }

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await dataURLtoBlob(imageDataURL, mimeType);

    await navigator.clipboard.write([
      new ClipboardItem({
        [mimeType]: blob
      })
    ]);
  };

  return {
    exportAsPng,
    generatePreview,
    exportToJpeg,
    exportProcessedImage,
    copyToClipboard,
  };
};