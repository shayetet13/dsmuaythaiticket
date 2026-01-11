/**
 * Resize hero image for social media sharing (Facebook, Twitter, etc.)
 * Creates a 1200x630px version optimized for Open Graph sharing
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to hero image
const heroDir = path.join(__dirname, '../../frontend/public/images/hero');
const imagesDir = path.join(__dirname, '../../frontend/public/images');
const highlightsDir = path.join(imagesDir, 'highlights');
const heroImagePath = path.join(heroDir, 'hero-bg.webp');
const heroImageJpgPath = path.join(heroDir, 'hero-bg.jpg');
const heroImageRMSHero = path.join(heroDir, '_RMS0100.jpg');
const heroImageRMSHeroWebp = path.join(heroDir, '_RMS0100.webp');
const heroImageRMSHighlights = path.join(highlightsDir, '_RMS0100.jpg');
const heroImageRMSHighlightsWebp = path.join(highlightsDir, '_RMS0100.webp');
const outputPath = path.join(heroDir, 'hero-social.webp');

// Facebook recommended size for Open Graph images
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;

/**
 * Resize hero image for social media sharing
 */
async function resizeHeroForSocial() {
  try {
    console.log('🖼️  Starting hero image resize for social media...');
    
    // Check which source file exists (priority: _RMS0100 in hero > _RMS0100 in highlights > hero-bg)
    let sourcePath = null;
    if (await fileExists(heroImageRMSHeroWebp)) {
      sourcePath = heroImageRMSHeroWebp;
      console.log(`📁 Found source: hero/${path.basename(heroImageRMSHeroWebp)}`);
    } else if (await fileExists(heroImageRMSHero)) {
      sourcePath = heroImageRMSHero;
      console.log(`📁 Found source: hero/${path.basename(heroImageRMSHero)}`);
    } else if (await fileExists(heroImageRMSHighlightsWebp)) {
      sourcePath = heroImageRMSHighlightsWebp;
      console.log(`📁 Found source: highlights/${path.basename(heroImageRMSHighlightsWebp)}`);
    } else if (await fileExists(heroImageRMSHighlights)) {
      sourcePath = heroImageRMSHighlights;
      console.log(`📁 Found source: highlights/${path.basename(heroImageRMSHighlights)}`);
    } else if (await fileExists(heroImagePath)) {
      sourcePath = heroImagePath;
      console.log(`📁 Found source: hero/${path.basename(heroImagePath)}`);
    } else if (await fileExists(heroImageJpgPath)) {
      sourcePath = heroImageJpgPath;
      console.log(`📁 Found source: hero/${path.basename(heroImageJpgPath)}`);
    } else {
      console.error(`❌ Hero image not found at:`);
      console.error(`   - ${heroImageRMSHeroWebp}`);
      console.error(`   - ${heroImageRMSHero}`);
      console.error(`   - ${heroImageRMSHighlightsWebp}`);
      console.error(`   - ${heroImageRMSHighlights}`);
      console.error(`   - ${heroImagePath}`);
      console.error(`   - ${heroImageJpgPath}`);
      process.exit(1);
    }

    console.log(`\n🔄 Resizing to ${TARGET_WIDTH}x${TARGET_HEIGHT}px...`);
    
    // Read source image
    const imageBuffer = await fs.readFile(sourcePath);
    
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`   Original size: ${metadata.width}x${metadata.height}px`);
    
    // Resize with cover fit (crops to fill, maintains aspect ratio)
    // This ensures the image fills the 1200x630 frame perfectly
    const resizedBuffer = await sharp(imageBuffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover', // Crop to fill the exact dimensions
        position: 'center' // Center the crop
      })
      .webp({ quality: 90 }) // High quality for social sharing
      .toBuffer();
    
    // Save resized image
    await fs.writeFile(outputPath, resizedBuffer);
    
    const outputSize = resizedBuffer.length;
    const outputSizeKB = (outputSize / 1024).toFixed(2);
    const outputSizeMB = (outputSize / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✅ Successfully created: ${path.basename(outputPath)}`);
    console.log(`   Size: ${TARGET_WIDTH}x${TARGET_HEIGHT}px`);
    console.log(`   File size: ${outputSizeKB} KB (${outputSizeMB} MB)`);
    console.log(`\n💡 This image is optimized for Facebook and Twitter sharing.`);
    console.log(`   Update meta tags to use: /images/hero/hero-social.webp`);
    
  } catch (error) {
    console.error('❌ Error resizing hero image:', error);
    process.exit(1);
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Run the resize
resizeHeroForSocial();
