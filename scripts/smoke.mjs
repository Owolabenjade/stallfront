// Smoke check for the demo path. Usage: npm run smoke   (BASE_URL=https://... npm run smoke for the deployed app)
// Covers: health, shop API, tool list, search, create_checkout (real PayPal sandbox order), order status.
// It cannot approve the payment: that step needs the sandbox buyer login in a browser.
const BASE = (process.argv[2] || process.env.SMOKE_URL || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SHOP = process.env.SMOKE_SHOP || 'corner-stall';
let failed = 0;

async function step(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    console.log(`ok   ${name} (${Date.now() - t0} ms)${detail ? `  ${detail}` : ''}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}: ${err.message}`);
  }
}

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function tool(name, args) {
  const res = await fetch(`${BASE}/api/shops/${SHOP}/tools/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-stallfront-channel': 'webmcp', 'x-stallfront-session': 'smoke', 'x-stallfront-agent': 'smoke check' },
    body: JSON.stringify(args),
  });
  const json = await res.json();
  if (!res.ok || json.isError) throw new Error(`${name} -> ${res.status} ${json.error || json.content?.[0]?.text}`);
  return json.structuredContent;
}

console.log(`Smoke check against ${BASE}`);
let health, found, checkout;
await step('health', async () => {
  health = await get('/healthz');
  if (!health.ok) throw new Error('not ok');
  return `paypal=${health.paypal} ai=${health.ai}`;
});
await step('shop API', async () => {
  const s = await get(`/api/shops/${SHOP}`);
  if (!s.products?.length) throw new Error('no products');
  return `${s.shop.name}, ${s.products.length} products`;
});
await step('tool definitions', async () => {
  const t = await get(`/api/shops/${SHOP}/tools`);
  const names = t.tools.map((x) => x.name);
  for (const n of ['search_products', 'get_product', 'create_checkout', 'get_order_status']) if (!names.includes(n)) throw new Error(`missing ${n}`);
  return names.join(', ');
});
await step('search_products under $30', async () => {
  found = await tool('search_products', { query: 'bag', max_price_usd: 30 });
  if (!found.results.length) throw new Error('no results');
  if (found.results.some((r) => r.price_usd > 30)) throw new Error('budget not respected');
  return found.results.map((r) => `${r.title} ${r.price}`).join('; ');
});
await step('create_checkout makes a PayPal sandbox order', async () => {
  checkout = await tool('create_checkout', { items: [{ product_id: found.results[0].product_id, quantity: 1 }] });
  if (!/^https:\/\/www\.sandbox\.paypal\.com\//.test(checkout.approve_url || '')) throw new Error(`unexpected approve_url ${checkout.approve_url}`);
  return `${checkout.paypal_order_id} total ${checkout.total}`;
});
await step('get_order_status', async () => {
  const s = await tool('get_order_status', { order_id: checkout.order_id });
  if (s.status !== 'awaiting_buyer_approval') throw new Error(`status ${s.status}`);
  return s.status;
});

console.log(failed ? `\n${failed} step(s) failed` : '\nAll steps passed');
process.exit(failed ? 1 : 0);
