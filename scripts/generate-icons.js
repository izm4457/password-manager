import { Jimp } from 'jimp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const iconSizes = {
  // PNG icons for various platforms
  png: [32, 64, 128, 256, 512],
  // macOS specific
  macos: [16, 32, 64, 128, 256, 512, 1024],
  // Windows Store icons
  windows: [
    { name: 'Square30x30Logo.png', size: 30 },
    { name: 'Square44x44Logo.png', size: 44 },
    { name: 'Square71x71Logo.png', size: 71 },
    { name: 'Square89x89Logo.png', size: 89 },
    { name: 'Square107x107Logo.png', size: 107 },
    { name: 'Square142x142Logo.png', size: 142 },
    { name: 'Square150x150Logo.png', size: 150 },
    { name: 'Square284x284Logo.png', size: 284 },
    { name: 'Square310x310Logo.png', size: 310 },
    { name: 'StoreLogo.png', size: 50 },
  ],
};

async function generateIcons() {
  const sourceIcon = path.join(rootDir, 'app-icon.png');
  const iconsDir = path.join(rootDir, 'src-tauri', 'icons');

  console.log('📦 アイコン生成を開始します...');
  console.log(`ソース: ${sourceIcon}`);

  // Load source image
  const image = await Jimp.read(sourceIcon);
  console.log(`✓ ソース画像を読み込みました (${image.width}x${image.height})`);

  // Generate standard PNG icons
  console.log('\n🖼️  標準PNGアイコンを生成中...');
  for (const size of iconSizes.png) {
    const outputPath = path.join(iconsDir, `${size}x${size}.png`);
    const resized = image.clone().resize({ w: size, h: size });
    await resized.write(outputPath);
    console.log(`  ✓ ${size}x${size}.png`);
  }

  // Generate 128x128@2x for macOS
  const outputPath2x = path.join(iconsDir, '128x128@2x.png');
  const resized2x = image.clone().resize({ w: 256, h: 256 });
  await resized2x.write(outputPath2x);
  console.log(`  ✓ 128x128@2x.png`);

  // Generate main icon.png (1024x1024)
  const mainIconPath = path.join(iconsDir, 'icon.png');
  const resizedMain = image.clone().resize({ w: 1024, h: 1024 });
  await resizedMain.write(mainIconPath);
  console.log(`  ✓ icon.png (1024x1024)`);

  // Generate Windows Store icons
  console.log('\n🪟 Windows Storeアイコンを生成中...');
  for (const { name, size } of iconSizes.windows) {
    const outputPath = path.join(iconsDir, name);
    const resized = image.clone().resize({ w: size, h: size });
    await resized.write(outputPath);
    console.log(`  ✓ ${name}`);
  }

  console.log('\n✅ すべてのアイコンを生成しました！');
  console.log('\n📝 次のステップ:');
  console.log('  1. macOS用 .icns ファイル:');
  console.log('     pnpm icons:macos');
  console.log('  2. Windows用 .ico ファイル:');
  console.log('     pnpm icons:windows');
}

generateIcons().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
