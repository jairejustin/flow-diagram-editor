import { toPng } from 'html-to-image';
import download from 'downloadjs';

export const exportCanvas = () => {
  const name = 'flowchart_export';
  
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
  };
};