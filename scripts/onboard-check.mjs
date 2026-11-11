// End-to-end check of seller onboarding in a real browser: sample photos -> AI drafts -> review -> publish.
// Publishing creates a shop and one PayPal sandbox catalog product per listing.
// Usage: node scripts/onboard-check.mjs [baseUrl] [--shots dir] [--no-publish]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('http')) || 'http://localhost:3000').replace(/\/$/, '');
const SHOTS = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const PUBLISH = !args.includes('--no-publish');
const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && fs.existsSync(p));

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
let ok = false;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 1000 });
  const drafts = [];
  page.on('response', async (res) => {
    if (!res.url().endsWith('/api/listings/draft')) return;
    const body = await res.json().catch(() => ({}));
    drafts.push(res.ok() ? `${body.listing?.title} $${body.listing?.price_usd} (${body.mode}, ${body.ms} ms)` : `HTTP ${res.status()} ${body.error || ''}`);
  });
  await page.goto(`${BASE}/new`, { waitUntil: 'networkidle0' });
  const name = `Check Stall ${new Date().toISOString().slice(11, 16).replace(':', '')}`;
  await page.type('#shop-name', name);
  await page.click('#use-samples');
  await page.waitForFunction(() => document.querySelectorAll('#thumbs img, #thumbs li, #thumbs > *').length >= 4, { timeout: 15000 });
  const t0 = Date.now();
  await page.click('#draft');
  await page.waitForFunction(() => !document.querySelector('#step-review').hidden || document.querySelector('#notice .err, #notice .notice.err'), { timeout: 300000 });
  const draftS = ((Date.now() - t0) / 1000).toFixed(1);
  const err = await page.$eval('#notice', (n) => n.innerText.trim()).catch(() => '');
  console.log(`drafts (${drafts.length}) in ${draftS} s:`);
  drafts.forEach((d) => console.log(`  ${d}`));
  if (err) console.log(`notice: ${err}`);
  const reviewVisible = await page.$eval('#step-review', (n) => !n.hidden);
  if (!reviewVisible) throw new Error('review step did not open');
  await new Promise((r) => setTimeout(r, 800));
  if (SHOTS) {
    await page.screenshot({ path: `${SHOTS}/review.png` });
    console.log(`saved ${SHOTS}/review.png`);
  }
  if (!PUBLISH) {
    ok = drafts.length >= 4;
  } else {
    const t1 = Date.now();
    await page.click('#publish');
    await page.waitForFunction(() => !document.querySelector('#step-live').hidden || /fail|error/i.test(document.querySelector('#publish-status')?.textContent || ''), { timeout: 120000 });
    const live = await page.$eval('#step-live', (n) => (n.hidden ? null : n.innerText.replace(/\s+/g, ' ').trim()));
    console.log(`publish: ${((Date.now() - t1) / 1000).toFixed(1)} s`);
    console.log(live ? `live step: ${live.slice(0, 600)}` : `publish status: ${await page.$eval('#publish-status', (n) => n.textContent)}`);
    const shopUrl = await page.$eval('#open-shop', (a) => a.href).catch(() => null);
    console.log(`shop url: ${shopUrl}`);
    if (SHOTS && live) {
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: `${SHOTS}/live.png` });
      console.log(`saved ${SHOTS}/live.png`);
    }
    ok = Boolean(live && /PROD-/.test(live));
  }
} catch (e) {
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
console.log(ok ? '\nOnboarding check passed' : '\nOnboarding check failed');
process.exit(ok ? 0 : 1);
