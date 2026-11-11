// End-to-end check of the in-page buyer assistant: opens the shop in headless Chrome, asks for a gift,
// and waits for the PayPal handoff card. The model runs on the server; every tool call runs in the page via WebMCP.
// Usage: node scripts/agent-check.mjs [baseUrl] [--screenshot path] [--prompt "..."]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('http')) || 'http://localhost:3000').replace(/\/$/, '');
const at = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
const SHOT = at('--screenshot');
const PROMPT = at('--prompt') || 'Travelling next week: get me a bag and a phone stand, under $30 for both';
const SHOP = process.env.SMOKE_SHOP || 'corner-stall';
const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && fs.existsSync(p));

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
let ok = false;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: Number(at('--height') || 900) });
  const turns = []; // one entry per model turn: model name, or the HTTP status when it failed
  page.on('response', async (res) => {
    if (!res.url().endsWith('/api/agent')) return;
    const body = await res.json().catch(() => ({}));
    turns.push(res.ok() ? body.model || '?' : `HTTP ${res.status()}`);
  });
  await page.goto(`${BASE}/s/${SHOP}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('#agent-ready span')?.textContent.startsWith('Agent-ready'), { timeout: 20000 });
  const t0 = Date.now();
  await page.type('#ask', PROMPT);
  await page.click('#send');
  await new Promise((r) => setTimeout(r, 1500));
  await page.waitForFunction(() => document.querySelector('.handoff a[href*="paypal.com"]') || document.querySelector('#chat .notice.err') || !document.querySelector('#send').hasAttribute('aria-busy'), { timeout: 120000 });
  const handoffAt = (Date.now() - t0) / 1000;
  // The handoff card appears when create_checkout runs; the assistant's closing message comes one model turn later.
  await page.waitForFunction(() => !document.querySelector('#send').hasAttribute('aria-busy'), { timeout: 60000 }).catch(() => {});
  const result = await page.evaluate(() => ({
    calls: [...document.querySelectorAll('#chat .call')].map((c) => `${c.querySelector('.tool').textContent} (${c.querySelector('.args').textContent})`),
    replies: [...document.querySelectorAll('#chat .msg.assistant')].map((m) => m.innerText.trim()),
    handoff: document.querySelector('.handoff')?.innerText.replace(/\s+/g, ' ').trim() || null,
    error: document.querySelector('#chat .notice.err')?.innerText || null,
    approve: document.querySelector('.handoff a[href*="paypal.com"]')?.href || null,
  }));
  console.log(`prompt: ${PROMPT}`);
  console.log(`tool calls via WebMCP (${result.calls.length}): ${result.calls.join(' -> ')}`);
  result.replies.forEach((r) => console.log(`assistant: ${r}`));
  console.log(result.handoff ? `handoff: ${result.handoff}` : `ERROR: ${result.error}`);
  if (result.approve) console.log(`approve_url: ${result.approve}`);
  console.log(`model turns (${turns.length}): ${turns.join(', ')}`);
  console.log(`time to handoff: ${handoffAt.toFixed(1)} s; finished: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  ok = Boolean(result.handoff);
  if (SHOT) {
    await new Promise((r) => setTimeout(r, 800)); // let the last message finish its fade-in
    await page.screenshot({ path: SHOT });
  }
} catch (err) {
  console.log(`FAIL ${err.message}`);
} finally {
  await browser.close();
}
process.exit(ok ? 0 : 1);
