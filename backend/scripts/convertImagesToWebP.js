/**
 * Convert existing images to WebP format
 * This script converts all JPG, JPEG, PNG images in the frontend/public/images directory to WebP
 */

import { convertFileToWebP } from '../services/imageService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend images directory
const imagesDir = path.join(__dirname, '../../frontend/public/images');

// Image extensions to convert
const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];

/**
 * Recursively find all image files in a directory
 */
async function findImageFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subFiles = await findImageFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (imageExtensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Convert all images to WebP
 */
async function convertAllImages() {
  try {
    console.log('🖼️  Starting image conversion to WebP...');
    console.log(`📁 Scanning directory: ${imagesDir}`);

    // Check if directory exists
    try {
      await fs.access(imagesDir);
    } catch (error) {
      console.error(`❌ Directory not found: ${imagesDir}`);
      console.error('Please make sure the frontend/public/images directory exists.');
      process.exit(1);
    }

    // Find all image files
    const imageFiles = await findImageFiles(imagesDir);
    
    if (imageFiles.length === 0) {
      console.log('ℹ️  No images found to convert.');
      return;
    }

    console.log(`📸 Found ${imageFiles.length} image(s) to convert:`);
    imageFiles.forEach(file => console.log(`   - ${file}`));

    // Convert each image
    let successCount = 0;
    let errorCount = 0;

    for (const imageFile of imageFiles) {
      try {
        console.log(`\n🔄 Converting: ${path.basename(imageFile)}`);
        
        // Convert to WebP (creates .webp file alongside original)
        const webpPath = await convertFileToWebP(imageFile, null, {
          quality: 85,
          maxWidth: 1920,
          maxHeight: 1080
        });

        console.log(`   ✅ Created: ${path.basename(webpPath)}`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error converting ${path.basename(imageFile)}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Conversion Summary:');
    console.log(`   ✅ Successfully converted: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Total processed: ${imageFiles.length}`);

    if (successCount > 0) {
      console.log('\n💡 Note: Original image files are preserved.');
      console.log('   WebP versions are created alongside originals.');
      console.log('   You can manually delete originals after verifying WebP files work correctly.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
convertAllImages();
