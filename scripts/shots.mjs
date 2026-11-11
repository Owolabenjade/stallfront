// Screenshots of the demo-path pages for design review. Usage: node scripts/shots.mjs <baseUrl> <outDir> [width]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const [base = 'http://localhost:3000', out = '.', width = '1366'] = process.argv.slice(2);
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', process.env.BROWSER_PATH].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: Number(width), height: 900 });
for (const [name, path] of [['landing', '/'], ['new', '/new'], ['dashboard', '/s/kiln-and-leaf/dashboard'], ['shop', '/s/kiln-and-leaf']]) {
  await page.goto(base + path, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
  console.log(`saved ${name}-${width}.png`);
}
await browser.close();
