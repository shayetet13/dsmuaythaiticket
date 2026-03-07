#!/usr/bin/env node
/**
 * Generate responsive hero images for LCP optimization.
 * Creates 640w (mobile) and 1024w (tablet) versions of the hero image.
 */
import sharp from 'sharp';
import { stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const heroDir = join(__dirname, '../public/images/hero');
const heroFile = 'World class fighters.webp';

async function generateResponsive() {
  const srcPath = join(heroDir, heroFile);
  try {
    await stat(srcPath);
    const baseName = heroFile.replace('.webp', '');
    const sizes = [
      { w: 640, suffix: '-640w' },
      { w: 1024, suffix: '-1024w' },
    ];

    for (const { w, suffix } of sizes) {
      const outPath = join(heroDir, `${baseName}${suffix}.webp`);
      await sharp(srcPath)
        .resize(w, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);
      console.log(`[generate-responsive-hero] Created ${baseName}${suffix}.webp (${w}w)`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('[generate-responsive-hero] Hero image not found, skipping');
    } else {
      console.error('[generate-responsive-hero] Error:', err.message);
    }
  }
}

generateResponsive();
