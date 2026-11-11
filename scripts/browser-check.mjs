// Browser check for the WebMCP surface: opens the shop page in headless Chrome or Edge,
// waits for the tools to register, then discovers and executes them through document.modelContext,
// the same API a browser agent uses. Usage: node scripts/browser-check.mjs [baseUrl] [--screenshot path]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('http')) || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const shotIdx = args.indexOf('--screenshot');
const SHOT = shotIdx >= 0 ? args[shotIdx + 1] : null;
const SHOP = process.env.SMOKE_SHOP || 'kiln-and-leaf';
const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = BROWSERS.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge found; set BROWSER_PATH.');
  process.exit(2);
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
let failed = 0;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/s/${SHOP}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('#agent-ready span')?.textContent.startsWith('Agent-ready'), { timeout: 15000 });
  const badge = await page.$eval('#agent-ready span', (n) => n.textContent);
  console.log(`ok   badge: ${badge}`);

  const discovered = await page.evaluate(async () => (await document.modelContext.getTools()).map((t) => t.name));
  console.log(`ok   document.modelContext.getTools(): ${discovered.join(', ')}`);
  if (discovered.length !== 4) failed++;

  const result = await page.evaluate(async () => {
    const tools = await document.modelContext.getTools();
    const search = tools.find((t) => t.name === 'search_products');
    const raw = await document.modelContext.executeTool(search, { query: 'tea', max_price_usd: 40 });
    return typeof raw === 'string' ? raw : JSON.stringify(raw);
  });
  const parsed = JSON.parse(result);
  const text = parsed.content?.[0]?.text || '';
  const data = JSON.parse(text);
  console.log(`ok   executeTool(search_products): ${data.results.length} results, first "${data.results[0]?.title}"`);
  const traced = await page.$$eval('.call', (n) => n.length);
  console.log(`${traced ? 'ok  ' : 'FAIL'} trace rows rendered on page: ${traced}`);
  if (!traced) failed++;
  if (errors.length) {
    failed++;
    console.log(`FAIL page errors: ${errors.join(' | ')}`);
  }
  if (SHOT) {
    await page.screenshot({ path: SHOT, fullPage: false });
    console.log(`saved ${SHOT}`);
  }
} catch (err) {
  failed++;
  console.log(`FAIL ${err.message}`);
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} check(s) failed` : '\nBrowser check passed');
process.exit(failed ? 1 : 0);
