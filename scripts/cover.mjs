// Renders docs/cover.html to docs/img/cover.png (1500 x 1000), the Devpost thumbnail.
// Usage: node scripts/cover.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const executablePath = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge found; set BROWSER_PATH.');
  process.exit(2);
}
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000 });
await page.goto(pathToFileURL(path.join(root, 'docs/cover.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const out = path.join(root, 'docs/img/cover.png');
await page.screenshot({ path: out });
await browser.close();
console.log('saved', path.relative(root, out));
