// Screenshots for the README, taken from a running server.
// Usage: node scripts/docs-shots.mjs <baseUrl> <paidOrderId>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [base = 'http://localhost:3000', orderId] = process.argv.slice(2);
const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();
const settle = () => new Promise((r) => setTimeout(r, 900));

await page.setViewport({ width: 1366, height: 1000 });
await page.goto(`${base}/s/corner-stall/dashboard`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelectorAll('details.trace').forEach((d, i) => { if (i < 2) d.open = true; }));
await settle();
await page.screenshot({ path: 'docs/img/seller-view.png' });
console.log('saved docs/img/seller-view.png');

if (orderId) {
  await page.setViewport({ width: 1366, height: 820 });
  await page.goto(`${base}/s/corner-stall/orders/${orderId}`, { waitUntil: 'networkidle0' });
  await settle();
  await page.screenshot({ path: 'docs/img/receipt.png' });
  console.log('saved docs/img/receipt.png');
}

await page.setViewport({ width: 1366, height: 900 });
await page.goto(`${base}/new`, { waitUntil: 'networkidle0' });
await settle();
await page.screenshot({ path: 'docs/img/new-shop.png' });
console.log('saved docs/img/new-shop.png');
await browser.close();
