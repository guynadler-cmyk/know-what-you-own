import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'attached_assets');
const outDir = path.join(root, 'client', 'public', 'images');

async function compressLogos() {
  const headerSrc = path.join(assetsDir, 'ChatGPT Image Jan 22, 2026, 01_43_07 PM_cropped.png');
  const headerMeta = await sharp(headerSrc).metadata();
  const headerDisplayHeight = 48;
  const headerTargetHeight = headerDisplayHeight * 2;
  const headerScale = headerTargetHeight / headerMeta.height;
  const headerTargetWidth = Math.round(headerMeta.width * headerScale);

  await sharp(headerSrc)
    .resize(headerTargetWidth, headerTargetHeight)
    .webp({ quality: 75 })
    .toFile(path.join(outDir, 'header-logo.webp'));

  const headerInfo = await sharp(path.join(outDir, 'header-logo.webp')).metadata();
  console.log(`Header logo: ${headerInfo.width}x${headerInfo.height} (display ${headerTargetWidth / 2}x${headerDisplayHeight}), ${headerInfo.size} bytes`);

  const footerSrc = path.join(assetsDir, 'ChatGPT_Image_Jan_12,_2026,_06_06_56_PM_1769108399893.png');
  const footerMeta = await sharp(footerSrc).metadata();
  const footerDisplayHeight = 80;
  const footerTargetHeight = footerDisplayHeight * 2;
  const footerScale = footerTargetHeight / footerMeta.height;
  const footerTargetWidth = Math.round(footerMeta.width * footerScale);

  await sharp(footerSrc)
    .resize(footerTargetWidth, footerTargetHeight)
    .webp({ quality: 80 })
    .toFile(path.join(outDir, 'footer-wordmark.webp'));

  const footerInfo = await sharp(path.join(outDir, 'footer-wordmark.webp')).metadata();
  console.log(`Footer wordmark: ${footerInfo.width}x${footerInfo.height} (display ${footerTargetWidth / 2}x${footerDisplayHeight}), ${footerInfo.size} bytes`);
}

compressLogos().catch(console.error);
