// Approves a PayPal sandbox order as the sandbox test buyer, in a real browser, then follows the redirect
// back to Stallfront (which captures the payment). Test-only: never use with live credentials.
// Usage: node --env-file=.env scripts/approve-sandbox.mjs <approve_url> [--show]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const url = process.argv[2];
const show = process.argv.includes('--show');
const { SANDBOX_BUYER_EMAIL: email, SANDBOX_BUYER_PASSWORD: password } = process.env;
if (!url?.startsWith('https://www.sandbox.paypal.com/')) throw new Error('Pass a sandbox approve URL');
if (!email || !password) throw new Error('Set SANDBOX_BUYER_EMAIL and SANDBOX_BUYER_PASSWORD');
const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: !show, args: ['--window-size=1280,900'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const shot = (n) => page.screenshot({ path: `${process.env.SHOT_DIR || '.'}/approve-${n}.png` }).catch(() => {});

async function clickByText(texts, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const clicked = await page.evaluate((texts) => {
      const els = [...document.querySelectorAll('button, input[type=submit], a[role=button]')];
      const el = els.find((e) => texts.some((t) => (e.innerText || e.value || '').trim().toLowerCase() === t.toLowerCase()) && e.offsetParent !== null);
      if (el) { el.click(); return (el.innerText || el.value).trim(); }
      return null;
    }, texts);
    if (clicked) return clicked;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No button with text ${texts.join(' / ')}`);
}

try {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await shot(1);
  await page.waitForSelector('#email', { visible: true, timeout: 30000 });
  await page.type('#email', email, { delay: 20 });
  const next = await page.$('#btnNext');
  if (next && (await next.boundingBox())) await next.click();
  await page.waitForSelector('#password', { visible: true, timeout: 30000 });
  await page.type('#password', password, { delay: 20 });
  await new Promise((r) => setTimeout(r, 500));
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#password') || document.querySelector('.notifications, [role=alert]')?.innerText, { timeout: 60000 }).catch(() => {});
  const alert = await page.evaluate(() => document.querySelector('.notifications, [role=alert]')?.innerText?.trim());
  if (alert) console.log(`PayPal says: ${alert}`);
  await page.waitForNetworkIdle({ idleTime: 1500, timeout: 60000 }).catch(() => {});
  await shot(2);
  const label = await clickByText(['Complete Purchase', 'Pay Now', 'Continue to Review Order', 'Continue', 'Agree & Pay', 'Pay']);
  console.log(`clicked "${label}"`);
  await page.waitForFunction(() => !location.hostname.endsWith('paypal.com'), { timeout: 90000 });
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 30000 }).catch(() => {});
  await shot(3);
  console.log(`returned to ${page.url()}`);
  const status = await page.evaluate(() => document.querySelector('.status')?.textContent?.trim() || null);
  console.log(`order page status: ${status}`);
} catch (err) {
  await shot('error');
  console.log(`FAIL ${err.message} (at ${page.url()})`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
