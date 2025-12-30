import { toPng } from 'html-to-image';
import download from 'downloadjs';

export const exportCanvas = () => {
  const name = 'flowchart_export';
  const generatePreview = async () => {
    const canvas = document.getElementById('canvas-container');
    
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    try {
      const dataUrl = await toPng(canvas);
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

  return {
    exportAsPng,
    generatePreview,
  };
};