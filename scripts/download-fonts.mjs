import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'client', 'public', 'fonts');

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': DESKTOP_UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': DESKTOP_UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

const cssUrl = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@400;500&display=swap';

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching Google Fonts CSS...');
  const css = await fetchText(cssUrl);

  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(css)) !== null) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} WOFF2 files`);

  for (const url of urls) {
    const filename = url.split('/').pop();
    const dest = path.join(outDir, filename);
    console.log(`Downloading ${filename}...`);
    await downloadFile(url, dest);
  }

  console.log('Done! Downloaded all font files.');

  const fontFaceBlocks = [];
  const srcRegex = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = srcRegex.exec(css)) !== null) {
    const subset = m[1];
    const block = m[2];

    const familyMatch = block.match(/font-family:\s*'([^']+)'/);
    const styleMatch = block.match(/font-style:\s*(\w+)/);
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
    const unicodeMatch = block.match(/unicode-range:\s*([^;]+)/);

    if (familyMatch && urlMatch) {
      const family = familyMatch[1];
      const style = styleMatch ? styleMatch[1] : 'normal';
      const weight = weightMatch ? weightMatch[1] : '400';
      const filename = urlMatch[1].split('/').pop();
      const unicodeRange = unicodeMatch ? unicodeMatch[1].trim() : '';

      fontFaceBlocks.push({ family, style, weight, filename, unicodeRange, subset });
    }
  }

  let cssOutput = '';
  for (const f of fontFaceBlocks) {
    cssOutput += `@font-face {
  font-family: '${f.family}';
  font-style: ${f.style};
  font-weight: ${f.weight};
  font-display: swap;
  src: url('/fonts/${f.filename}') format('woff2');${f.unicodeRange ? `\n  unicode-range: ${f.unicodeRange};` : ''}
}\n\n`;
  }

  fs.writeFileSync(path.join(outDir, 'font-faces.css'), cssOutput);
  console.log(`Generated font-faces.css with ${fontFaceBlocks.length} @font-face declarations`);
}

main().catch(console.error);
