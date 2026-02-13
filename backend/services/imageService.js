/**
 * Image Service
 * Handles image conversion to WebP format for better performance
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert base64 image to WebP format
 * @param {string} base64Image - Base64 encoded image (with or without data URL prefix)
 * @param {object} options - Conversion options
 * @param {number} options.quality - WebP quality (1-100), default: 85
 * @param {number} options.maxWidth - Maximum width, default: 1920
 * @param {number} options.maxHeight - Maximum height, default: 1080
 * @returns {Promise<string>} - Base64 encoded WebP image
 */
export const convertBase64ToWebP = async (base64Image, options = {}) => {
  try {
    const { quality = 85, maxWidth = 1920, maxHeight = 1080 } = options;

    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Convert to WebP using sharp
    const webpBuffer = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Convert back to base64 with WebP data URL prefix
    const webpBase64 = webpBuffer.toString('base64');
    return `data:image/webp;base64,${webpBase64}`;
  } catch (error) {
    console.error('Error converting base64 to WebP:', error);
    throw new Error(`Failed to convert image to WebP: ${error.message}`);
  }
};

/**
 * Convert image file to WebP format
 * @param {string} inputPath - Path to input image file
 * @param {string} outputPath - Path to output WebP file (optional, defaults to same name with .webp extension)
 * @param {object} options - Conversion options
 * @param {number} options.quality - WebP quality (1-100), default: 85
 * @param {number} options.maxWidth - Maximum width, default: 1920
 * @param {number} options.maxHeight - Maximum height, default: 1080
 * @returns {Promise<string>} - Path to converted WebP file
 */
export const convertFileToWebP = async (inputPath, outputPath = null, options = {}) => {
  try {
    const { quality = 85, maxWidth = 1920, maxHeight = 1080 } = options;

    // Determine output path
    if (!outputPath) {
      const ext = path.extname(inputPath);
      outputPath = inputPath.replace(ext, '.webp');
    }

    // Read input file
    const inputBuffer = await fs.readFile(inputPath);

    // Convert to WebP
    await sharp(inputBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error(`Error converting file to WebP (${inputPath}):`, error);
    throw new Error(`Failed to convert file to WebP: ${error.message}`);
  }
};

/**
 * Convert image file to WebP and return as base64
 * @param {string} inputPath - Path to input image file
 * @param {object} options - Conversion options
 * @returns {Promise<string>} - Base64 encoded WebP image
 */
export const convertFileToWebPBase64 = async (inputPath, options = {}) => {
  try {
    const { quality = 85, maxWidth = 1920, maxHeight = 1080 } = options;

    // Read input file
    const inputBuffer = await fs.readFile(inputPath);

    // Convert to WebP buffer
    const webpBuffer = await sharp(inputBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Convert to base64
    const webpBase64 = webpBuffer.toString('base64');
    return `data:image/webp;base64,${webpBase64}`;
  } catch (error) {
    console.error(`Error converting file to WebP base64 (${inputPath}):`, error);
    throw new Error(`Failed to convert file to WebP: ${error.message}`);
  }
};

/**
 * Check if image is already WebP format
 * @param {string} base64Image - Base64 encoded image
 * @returns {boolean} - True if image is WebP
 */
export const isWebP = (base64Image) => {
  return base64Image.startsWith('data:image/webp') || 
         base64Image.includes('image/webp');
};

/**
 * Check if image path is WebP
 * @param {string} imagePath - Image file path
 * @returns {boolean} - True if path ends with .webp
 */
export const isWebPPath = (imagePath) => {
  return imagePath.toLowerCase().endsWith('.webp');
};

/**
 * Convert image path reference to WebP path
 * @param {string} imagePath - Original image path (e.g., /images/hero/image.jpg)
 * @returns {string} - WebP path (e.g., /images/hero/image.webp)
 */
export const convertPathToWebP = (imagePath) => {
  if (!imagePath || isWebPPath(imagePath)) {
    return imagePath;
  }

  // Replace common image extensions with .webp
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  let webpPath = imagePath;

  for (const ext of extensions) {
    if (imagePath.toLowerCase().endsWith(ext)) {
      webpPath = imagePath.slice(0, -ext.length) + '.webp';
      break;
    }
  }

  return webpPath;
};

/**
 * Process image - convert to WebP if needed
 * @param {string} image - Base64 image or image path
 * @param {object} options - Conversion options
 * @returns {Promise<string>} - Processed image (WebP base64 or WebP path)
 */
export const processImage = async (image, options = {}) => {
  if (!image) {
    return image;
  }

  // If it's a base64 image
  if (image.startsWith('data:image/')) {
    // Skip if already WebP
    if (isWebP(image)) {
      return image;
    }
    // Convert to WebP
    return await convertBase64ToWebP(image, options);
  }

  // If it's a file path, convert path reference
  return convertPathToWebP(image);
};
