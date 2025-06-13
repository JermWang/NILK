import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');

async function findPngFiles(dir) {
  let files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(await findPngFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.png')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const webpPath = filePath.replace(/\.png$/, '.webp');
  try {
    const originalSize = (await fs.stat(filePath)).size;
    
    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(webpPath);
      
    const newSize = (await fs.stat(webpPath)).size;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2);
    
    console.log(`Optimized: ${path.basename(filePath)} -> ${path.basename(webpPath)}`);
    console.log(`Size reduction: ${reduction}%`);
    console.log('---');

  } catch (error) {
    console.error(`Failed to optimize ${filePath}:`, error);
  }
}

async function main() {
  console.log('Starting image optimization...');
  const pngFiles = await findPngFiles(publicDir);
  
  if (pngFiles.length === 0) {
    console.log('No PNG files found to optimize.');
    return;
  }
  
  console.log(`Found ${pngFiles.length} PNG files to optimize.`);
  console.log('---');

  for (const file of pngFiles) {
    await optimizeImage(file);
  }
  
  console.log('Image optimization complete.');
}

main().catch(console.error); 