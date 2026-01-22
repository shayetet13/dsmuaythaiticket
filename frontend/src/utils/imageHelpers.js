/**
 * Image Helper Functions
 * UI-level image optimization and compression
 * Note: This is client-side optimization to reduce upload bandwidth
 */

/**
 * Check if browser supports WebP format
 * @returns {Promise<boolean>} - True if WebP is supported
 */
const checkWebPSupport = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Compress image for upload (client-side optimization)
 * Converts to WebP format if supported, otherwise falls back to JPEG
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<string>} - Base64 compressed image (WebP or JPEG)
 */
export const compressImage = async (file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        const webPSupported = await checkWebPSupport();
        if (webPSupported) {
          try {
            // Convert to WebP (quality 0-1, but WebP uses 0-100 internally)
            const webpData = canvas.toDataURL('image/webp', quality);
            resolve(webpData);
            return;
          } catch (error) {
            console.warn('WebP conversion failed, falling back to JPEG:', error);
          }
        }

        // Fallback to JPEG
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImage = (file, maxSizeMB = 10) => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
    };
  }

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`
    };
  }

  return { valid: true, error: null };
};

/**
 * Generate thumbnail from image
 * @param {string} imageData - Base64 image data
 * @param {number} size - Thumbnail size (width/height)
 * @returns {Promise<string>} - Base64 thumbnail (WebP or JPEG)
 */
export const generateThumbnail = async (imageData, size = 200) => {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.src = imageData;
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      
      // Calculate crop dimensions (center crop)
      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
      );

      // Try WebP first, fallback to JPEG
      const webPSupported = await checkWebPSupport();
      if (webPSupported) {
        try {
          const webpData = canvas.toDataURL('image/webp', 0.8);
          resolve(webpData);
          return;
        } catch (error) {
          console.warn('WebP thumbnail conversion failed, falling back to JPEG:', error);
        }
      }

      // Fallback to JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
  });
};

