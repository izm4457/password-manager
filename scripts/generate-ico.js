import { Jimp } from 'jimp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// ICO file format helper
function createIcoFile(images) {
  // ICO header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved (must be 0)
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(images.length, 4); // Number of images

  // Directory entries (16 bytes each)
  const entries = [];
  let dataOffset = 6 + images.length * 16;

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0); // Width (0 = 256)
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1); // Height (0 = 256)
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // Image data size
    entry.writeUInt32LE(dataOffset, 12); // Offset to image data
    entries.push(entry);
    dataOffset += img.data.length;
  }

  // Combine all parts
  return Buffer.concat([header, ...entries, ...images.map((img) => img.data)]);
}

async function generateIco() {
  const iconsDir = path.join(rootDir, 'src-tauri', 'icons');
  const sizes = [16, 32, 48, 64, 128, 256];

  console.log('🪟 Windows用 .ico ファイルを生成中...');

  const images = [];

  for (const size of sizes) {
    const iconPath = path.join(iconsDir, `${size}x${size}.png`);
    
    // Generate missing sizes
    if (size === 16 || size === 48) {
      const sourceSize = size === 16 ? 32 : 64;
      const sourcePath = path.join(iconsDir, `${sourceSize}x${sourceSize}.png`);
      const sourceImage = await Jimp.read(sourcePath);
      const resized = sourceImage.clone().resize({ w: size, h: size });
      await resized.write(iconPath);
      console.log(`  ✓ ${size}x${size}.png を生成`);
    }

    const image = await Jimp.read(iconPath);
    const pngBuffer = await image.getBuffer('image/png');

    images.push({
      width: size,
      height: size,
      data: pngBuffer,
    });
  }

  const icoBuffer = createIcoFile(images);
  const outputPath = path.join(iconsDir, 'icon.ico');
  await fs.writeFile(outputPath, icoBuffer);

  console.log(`✅ icon.ico を生成しました: ${outputPath}`);
}

generateIco().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
