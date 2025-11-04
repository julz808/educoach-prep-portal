#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGES_DIR = join(__dirname, '..', 'public', 'images');
const WEBP_QUALITY = 85; // Good balance between quality and size
const PNG_QUALITY = 90;

async function getImageFiles(dir) {
  const files = await readdir(dir);
  const imageFiles = [];

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);

    if (stats.isFile()) {
      const ext = extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        imageFiles.push(filePath);
      }
    }
  }

  return imageFiles;
}

async function optimizeImage(inputPath) {
  const ext = extname(inputPath);
  const baseName = basename(inputPath, ext);
  const dirName = dirname(inputPath);
  const webpPath = join(dirName, `${baseName}.webp`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`\nProcessing: ${basename(inputPath)}`);
    console.log(`  Original size: ${(metadata.size / 1024).toFixed(2)} KB`);
    console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);

    // Convert to WebP
    await image
      .clone()
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const webpStats = await stat(webpPath);
    const originalSize = metadata.size;
    const webpSize = webpStats.size;
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

    console.log(`  ✅ Created WebP: ${(webpSize / 1024).toFixed(2)} KB (${savings}% smaller)`);

    // Also compress the original PNG
    if (ext === '.png') {
      const tempPath = inputPath + '.optimized';
      await image
        .clone()
        .png({ quality: PNG_QUALITY, compressionLevel: 9 })
        .toFile(tempPath);

      const optimizedStats = await stat(tempPath);
      const pngSavings = ((originalSize - optimizedStats.size) / originalSize * 100).toFixed(1);

      if (optimizedStats.size < originalSize) {
        console.log(`  ✅ Compressed PNG: ${(optimizedStats.size / 1024).toFixed(2)} KB (${pngSavings}% smaller)`);
        // Note: You'd need to replace the original file here
        // For safety, we're not doing that automatically
      }
    }

    return {
      original: basename(inputPath),
      originalSize,
      webpSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`  ❌ Error processing ${basename(inputPath)}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('================================\n');
  console.log(`Looking for images in: ${IMAGES_DIR}\n`);

  const imageFiles = await getImageFiles(IMAGES_DIR);

  if (imageFiles.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${imageFiles.length} images to optimize\n`);

  const results = [];
  for (const imagePath of imageFiles) {
    const result = await optimizeImage(imagePath);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log('\n\n📊 Optimization Summary');
  console.log('================================');
  console.log(`Total images processed: ${results.length}`);

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalWebP = results.reduce((sum, r) => sum + r.webpSize, 0);
  const totalSavings = ((totalOriginal - totalWebP) / totalOriginal * 100).toFixed(1);

  console.log(`Total original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total WebP size: ${(totalWebP / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings: ${totalSavings}%`);
  console.log(`\n✅ All images optimized successfully!`);
  console.log(`\n💡 Tip: Update your image references to use .webp extensions for better performance.`);
}

main().catch(console.error);
