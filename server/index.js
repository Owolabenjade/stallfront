import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from './store.js';
import { TOOL_DEFS, runTool, settleOrder } from './tools.js';
import { paypalConfigured } from './paypal.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
process.env.BASE_URL ||= `http://localhost:${PORT}`;
// Render sets RENDER_EXTERNAL_URL; prefer it when BASE_URL was left at the localhost default.
if (process.env.RENDER_EXTERNAL_URL && process.env.BASE_URL.startsWith('http://localhost')) {
  process.env.BASE_URL = process.env.RENDER_EXTERNAL_URL;
}

store.load();
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '15mb' }));

const page = (name) => (req, res) => res.sendFile(path.join(PUBLIC, name));

function shopOr404(req, res) {
  const shop = store.getShop(req.params.slug);
  if (!shop) res.status(404).json({ error: `No shop called ${req.params.slug}` });
  return shop;
}

const publicOrder = (o) => ({
  id: o.id,
  shopSlug: o.shopSlug,
  channel: o.channel,
  agent: o.agent,
  items: o.items,
  itemCents: o.itemCents,
  shippingCents: o.shippingCents,
  totalCents: o.totalCents,
  status: o.status,
  paypalOrderId: o.paypalOrderId,
  captureId: o.captureId || null,
  approveUrl: o.status === 'awaiting_buyer' ? o.approveUrl : null,
  createdAt: o.createdAt,
  paidAt: o.paidAt || null,
});

// ---------- health ----------
app.get('/healthz', (req, res) => res.json({ ok: true, paypal: paypalConfigured(), anthropic: Boolean(process.env.ANTHROPIC_API_KEY) }));

// ---------- vendor: WebMCP polyfill served from the pinned npm package ----------
app.get('/vendor/webmcp.js', (req, res) => res.sendFile(path.join(ROOT, 'node_modules/@mcp-b/global/dist/index.iife.js')));

// ---------- shop API ----------
app.get('/api/shops/:slug', (req, res) => {
  const shop = shopOr404(req, res);
  if (!shop) return;
  const { adminKey, ...pub } = shop;
  res.json({ shop: pub, products: store.shopProducts(shop.slug) });
});

app.get('/api/shops/:slug/tools', (req, res) => {
  if (!shopOr404(req, res)) return;
  res.json({ tools: TOOL_DEFS });
});

app.post('/api/shops/:slug/tools/:name', async (req, res, next) => {
  const shop = shopOr404(req, res);
  if (!shop) return;
  const channel = req.get('x-stallfront-channel') === 'web' ? 'web' : 'webmcp';
  try {
    const result = await runTool(shop, req.params.name, req.body || {}, {
      channel,
      sessionId: req.get('x-stallfront-session') || null,
      agent: req.get('x-stallfront-agent') || null,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    let order = store.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'No such order' });
    if (order.status === 'awaiting_buyer' && req.query.refresh) order = await settleOrder(order);
    res.json({ order: publicOrder(order), shop: { name: store.getShop(order.shopSlug)?.name, slug: order.shopSlug } });
  } catch (err) {
    next(err);
  }
});

// ---------- PayPal return and cancel ----------
app.get('/s/:slug/paypal/return', async (req, res) => {
  const order = store.getOrder(String(req.query.order || ''));
  if (!order || order.shopSlug !== req.params.slug) return res.redirect(`/s/${req.params.slug}?notice=unknown-order`);
  try {
    await settleOrder(order);
  } catch (err) {
    store.updateOrder(order.id, { lastError: err.message });
  }
  res.redirect(`/s/${order.shopSlug}/orders/${order.id}`);
});

app.get('/s/:slug/paypal/cancel', (req, res) => {
  const order = store.getOrder(String(req.query.order || ''));
  if (order && order.shopSlug === req.params.slug && order.status === 'awaiting_buyer') {
    store.updateOrder(order.id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
  }
  res.redirect(`/s/${req.params.slug}?notice=cancelled`);
});

// ---------- pages ----------
app.get('/', page('index.html'));
app.get('/s/:slug', page('shop.html'));
app.get('/s/:slug/orders/:id', page('order.html'));
app.use(express.static(PUBLIC, { extensions: ['html'] }));

// ---------- errors ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error', debugId: err.debugId || undefined });
});

app.listen(PORT, () => {
  console.log(`Stallfront on ${process.env.BASE_URL} (PayPal ${paypalConfigured() ? 'configured' : 'NOT configured'})`);
});
