// Shopper path check: opens the shop page in headless Chrome or Edge, clicks a product's
// "Buy with PayPal" button (no assistant involved) and waits for the PayPal sandbox approval page.
// Prints the approval URL so scripts/approve-sandbox.mjs can finish the payment.
// Usage: node scripts/buy-check.mjs [baseUrl] [--product <title words>]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('http')) || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const pIdx = args.indexOf('--product');
const WANT = pIdx >= 0 ? args[pIdx + 1].toLowerCase() : null;
const SHOP = process.env.SMOKE_SHOP || 'corner-stall';
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

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
let code = 0;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const t0 = Date.now();
  await page.goto(`${BASE}/s/${SHOP}`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('[data-buy]:not([disabled])', { timeout: 30000 });
  const picked = await page.evaluate((want) => {
    const cards = [...document.querySelectorAll('article.product')];
    const card = cards.find((c) => !want || c.querySelector('h3').textContent.toLowerCase().includes(want)) || null;
    const btn = card?.querySelector('[data-buy]:not([disabled])');
    if (!btn) return null;
    btn.click();
    return { title: card.querySelector('h3').textContent, price: card.querySelector('.price')?.textContent };
  }, WANT);
  if (!picked) throw new Error(`No buyable product${WANT ? ` matching "${WANT}"` : ''}`);
  const t1 = Date.now();
  await page.waitForFunction(() => location.hostname.endsWith('paypal.com'), { timeout: 30000 });
  const url = page.url();
  console.log(`clicked "Buy with PayPal" on ${picked.title} (${picked.price})`);
  console.log(`reached PayPal in ${((Date.now() - t1) / 1000).toFixed(1)} s (page load ${((t1 - t0) / 1000).toFixed(1)} s)`);
  console.log(`approve_url ${url}`);
  if (!url.startsWith('https://www.sandbox.paypal.com/')) {
    console.error('Expected the PayPal sandbox approval page');
    code = 1;
  }
} catch (err) {
  console.error(`FAIL ${err.message}`);
  code = 1;
} finally {
  await browser.close();
}
process.exit(code);
