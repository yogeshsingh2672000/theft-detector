/**
 * Compresses an image from a data URL to reduce file size before sending to API
 * 
 * @param dataUrl The original image as a data URL
 * @param maxWidth Maximum width of the compressed image
 * @param quality JPEG quality (0-1)
 * @returns A Promise that resolves to the compressed image as a data URL
 */
export const compressImage = (
  dataUrl: string,
  maxWidth = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.floor(height * ratio);
        }
        
        // Create canvas and draw the resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to data URL with the specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Load the image from the data URL
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Extract the base64 data from a data URL
 * 
 * @param dataUrl The data URL (e.g., "data:image/jpeg;base64,...")
 * @returns The base64 data without the prefix
 */
export const getBase64FromDataUrl = (dataUrl: string): string => {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex !== -1) {
    return dataUrl.substring(commaIndex + 1);
  }
  return dataUrl;
};

/**
 * Calculate the approximate file size of a data URL in kilobytes
 * 
 * @param dataUrl The data URL
 * @returns The approximate file size in KB
 */
export const calculateDataUrlSize = (dataUrl: string): number => {
  // Remove the prefix (data:image/jpeg;base64,)
  const base64 = getBase64FromDataUrl(dataUrl);
  
  // Calculate the size in bytes (base64 represents 6 bits per char, not 8)
  // So we multiply by 0.75 to get the actual size in bytes
  const sizeInBytes = Math.ceil((base64.length * 0.75));
  
  // Convert to KB
  return Math.round(sizeInBytes / 1024);
}; 