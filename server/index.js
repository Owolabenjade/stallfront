import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as store from './store.js';
import { TOOL_DEFS, runTool, settleOrder } from './tools.js';
import { paypalConfigured, createCatalogProduct } from './paypal.js';
import { agentTurn, draftListing, aiConfigured, AGENT_MODELS, VISION_MODEL } from './ai.js';
import { mountMcp } from './mcp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.join(process.env.DATA_DIR || path.join(ROOT, 'data'), 'uploads');
const PORT = Number(process.env.PORT || 3000);
process.env.BASE_URL ||= `http://localhost:${PORT}`;
// Render sets RENDER_EXTERNAL_URL; prefer it when BASE_URL was left at the localhost default.
if (process.env.RENDER_EXTERNAL_URL && process.env.BASE_URL.startsWith('http://localhost')) {
  process.env.BASE_URL = process.env.RENDER_EXTERNAL_URL;
}

store.load();
fs.mkdirSync(UPLOADS, { recursive: true });
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));

const page = (name) => (req, res) => res.sendFile(path.join(PUBLIC, name));
const httpError = (status, message) => Object.assign(new Error(message), { status });

function shopOr404(req, res) {
  const shop = store.getShop(req.params.slug);
  if (!shop) res.status(404).json({ error: `No shop called ${req.params.slug}` });
  return shop;
}

// Simple in-memory rate limit per client IP and bucket, to protect the public demo's API spend.
const hits = new Map();
function limit(bucket, max, windowMs) {
  return (req, res, next) => {
    const key = `${bucket}:${req.ip}`;
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: 'Too many requests from this address; wait a few minutes and try again.' });
    list.push(now);
    hits.set(key, list);
    next();
  };
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
  note: o.note || null,
  status: o.status,
  paypalOrderId: o.paypalOrderId,
  captureId: o.captureId || null,
  approveUrl: o.status === 'awaiting_buyer' ? o.approveUrl : null,
  createdAt: o.createdAt,
  paidAt: o.paidAt || null,
});

const canAdmin = (shop, req) => shop.demo || (req.query.key && crypto.timingSafeEqual(Buffer.from(String(req.query.key).padEnd(64).slice(0, 64)), Buffer.from(String(shop.adminKey).padEnd(64).slice(0, 64))));

// ---------- health ----------
app.get('/healthz', (req, res) => res.json({ ok: true, paypal: paypalConfigured(), ai: aiConfigured(), agentModel: AGENT_MODELS[0], visionModel: VISION_MODEL }));

// ---------- static vendor and uploads ----------
app.get('/vendor/webmcp.js', (req, res) => res.sendFile(path.join(ROOT, 'node_modules/@mcp-b/global/dist/index.iife.js')));
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d', fallthrough: false }));

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

app.post('/api/shops/:slug/tools/:name', limit('tools', 120, 10 * 60 * 1000), async (req, res, next) => {
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

// Seller view: orders with channel, agent trace and PayPal IDs.
app.get('/api/shops/:slug/dashboard', (req, res) => {
  const shop = shopOr404(req, res);
  if (!shop) return;
  if (!canAdmin(shop, req)) return res.status(403).json({ error: 'This seller view needs the private link the shop was created with.' });
  const orders = store.shopOrders(shop.slug).map((o) => ({ ...publicOrder(o), trace: store.sessionTrace(shop.slug, o.sessionId) }));
  const activity = store.load().activity.filter((a) => a.shopSlug === shop.slug).slice(-40).reverse();
  const { adminKey, ...pub } = shop;
  res.json({ shop: pub, products: store.shopProducts(shop.slug), orders, activity });
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

// ---------- buyer agent: one model turn; the browser executes the tools through WebMCP ----------
app.post('/api/agent', limit('agent', 60, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const shop = store.getShop(String(req.body?.shop || ''));
    if (!shop) throw httpError(404, 'Unknown shop');
    res.json(await agentTurn(shop, req.body.messages));
  } catch (err) {
    if (err.status === 429) res.set('Retry-After', String(err.retryAfter || 8));
    next(err);
  }
});

// ---------- seller onboarding: photos to draft listings, then publish ----------
const MEDIA = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// One photo per request (the free vision model takes few images per call); the page loops and shows progress.
app.post('/api/listings/draft', limit('draft', 30, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const draftId = /^[a-f0-9]{12}$/.test(req.body?.draftId || '') ? req.body.draftId : crypto.randomBytes(6).toString('hex');
    const index = Math.min(Math.max(parseInt(req.body?.index, 10) || 1, 1), 6);
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(req.body?.photo || ''));
    if (!m) throw httpError(400, `Photo ${index} is not a JPEG, PNG or WebP image.`);
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 3 * 1024 * 1024) throw httpError(400, `Photo ${index} is larger than 3 MB.`);
    const dir = path.join(UPLOADS, draftId);
    fs.mkdirSync(dir, { recursive: true });
    const file = `${index}.${MEDIA[m[1]]}`;
    fs.writeFileSync(path.join(dir, file), buf);
    const t0 = Date.now();
    const out = await draftListing({ mediaType: m[1], data: m[2] }, req.body.hint);
    res.json({ draftId, index, ms: Date.now() - t0, model: out.model, mode: out.mode, listing: { ...out.listing, imageUrl: `/uploads/${draftId}/${file}` } });
  } catch (err) {
    if (err.status === 429) res.set('Retry-After', String(err.retryAfter || 10));
    next(err);
  }
});

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'shop';

app.post('/api/shops', limit('create', 6, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 60);
    if (!name) throw httpError(400, 'Give the shop a name.');
    const items = Array.isArray(b.products) ? b.products.slice(0, 12) : [];
    if (!items.length) throw httpError(400, 'Add at least one product.');
    let slug = slugify(name);
    while (store.getShop(slug)) slug = `${slugify(name)}-${crypto.randomBytes(2).toString('hex')}`;
    const shippingCents = Math.max(0, Math.min(5000, Math.round(Number(b.shippingUsd ?? 6) * 100)));
    const shop = {
      slug,
      name,
      tagline: String(b.tagline || '').trim().slice(0, 120),
      shippingCents,
      currency: 'USD',
      adminKey: crypto.randomBytes(16).toString('hex'),
      demo: false,
      createdAt: new Date().toISOString(),
    };
    const base = process.env.BASE_URL;
    const products = items.map((p) => {
      const priceCents = Math.round(Number(p.priceUsd) * 100);
      if (!p.title || !Number.isFinite(priceCents) || priceCents < 100 || priceCents > 100000) throw httpError(400, `Check the title and price of "${p.title || 'a product'}" (price between $1 and $1,000).`);
      return {
        id: store.newId('prd'),
        shopSlug: slug,
        title: String(p.title).slice(0, 80),
        priceCents,
        category: String(p.category || 'other').slice(0, 30),
        summary: String(p.summary || '').slice(0, 160),
        description: String(p.description || '').slice(0, 800),
        attributes: Object.fromEntries(Object.entries(p.attributes || {}).slice(0, 6).map(([k, v]) => [String(k).slice(0, 20), String(v).slice(0, 60)])),
        tags: (p.tags || []).slice(0, 10).map((t) => String(t).toLowerCase().slice(0, 30)),
        giftFor: (p.giftFor || p.gift_for || []).slice(0, 5).map((t) => String(t).slice(0, 40)),
        stock: Math.max(0, Math.min(999, parseInt(p.stock ?? 5, 10) || 0)),
        imageUrl: /^\/uploads\/[a-f0-9]+\/\d\.(jpg|png|webp)$/.test(p.imageUrl || '') ? p.imageUrl : null,
        paypalProductId: null,
        status: 'live',
      };
    });

    // Register each product in the PayPal catalog (sandbox). A failure is reported, not fatal.
    const warnings = [];
    await Promise.all(
      products.map(async (p) => {
        try {
          p.paypalProductId = await createCatalogProduct({
            name: p.title,
            description: p.summary || p.description,
            imageUrl: p.imageUrl && base.startsWith('https://') ? `${base}${p.imageUrl}` : null,
            homeUrl: base.startsWith('https://') ? `${base}/s/${slug}` : null,
          });
        } catch (err) {
          warnings.push(`${p.title}: ${err.message}`);
        }
      }),
    );

    const db = store.load();
    db.shops.push(shop);
    db.products.push(...products);
    store.save();
    res.status(201).json({
      slug,
      shopUrl: `/s/${slug}`,
      dashboardUrl: `/s/${slug}/dashboard?key=${shop.adminKey}`,
      mcpUrl: `${base}/mcp/${slug}`,
      products: products.map((p) => ({ id: p.id, title: p.title, paypalProductId: p.paypalProductId })),
      warnings,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- MCP endpoint ----------
mountMcp(app);

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
app.get('/new', page('new.html'));
app.get('/s/:slug', page('shop.html'));
app.get('/s/:slug/dashboard', page('dashboard.html'));
app.get('/s/:slug/orders/:id', page('order.html'));
app.use(express.static(PUBLIC, { extensions: ['html'] }));

// ---------- errors ----------
app.use((err, req, res, next) => {
  if (!err.status || err.status === 500) console.error(err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server.' : err.message, debugId: err.debugId || undefined });
});

app.listen(PORT, () => {
  console.log(`Stallfront on ${process.env.BASE_URL} (PayPal ${paypalConfigured() ? 'configured' : 'NOT configured'}, AI ${aiConfigured() ? `${AGENT_MODELS[0]} + ${VISION_MODEL}` : 'NOT configured'})`);
});
