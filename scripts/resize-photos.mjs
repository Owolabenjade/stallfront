// Resizes photos to at most 1280 px on the long side (JPEG, quality 0.85) in headless Chrome,
// the same way /new does in the seller's browser. No image library needed.
// Usage: node scripts/resize-photos.mjs <outDir> <in.jpg>=<out-name.jpg> ...
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...pairs] = process.argv.slice(2);
if (!outDir || !pairs.length) throw new Error('usage: resize-photos.mjs <outDir> <in>=<out> ...');
const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();
fs.mkdirSync(outDir, { recursive: true });
for (const pair of pairs) {
  const [src, name] = pair.split('=');
  const dataUrl = `data:image/jpeg;base64,${fs.readFileSync(src).toString('base64')}`;
  const out = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/jpeg', 0.85), w: c.width, h: c.height };
  }, dataUrl);
  const file = path.join(outDir, name);
  fs.writeFileSync(file, Buffer.from(out.url.split(',')[1], 'base64'));
  console.log(`${file}  ${out.w}x${out.h}  ${Math.round(fs.statSync(file).size / 1024)} KB`);
}
await browser.close();
