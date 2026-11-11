// The shop's agent tools. One definition serves three surfaces:
// WebMCP (registered in the browser, executed through /api/shops/:slug/tools/:name),
// the MCP endpoint (/mcp/:slug), and the in-page buyer agent.
import * as store from './store.js';
import * as paypal from './paypal.js';

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export const TOOL_DEFS = [
  {
    name: 'search_products',
    description:
      'Search this shop\'s products. Matches words against titles, descriptions, materials, tags and who the item suits as a gift. ' +
      'Use max_price_usd to stay within a budget (item price, before the flat shipping fee). Returns product IDs to use with get_product and create_checkout.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text need, e.g. "gift for a coffee lover"' },
        max_price_usd: { type: 'number', description: 'Upper bound on the item price in USD' },
        limit: { type: 'integer', description: 'Maximum results (default 5)', minimum: 1, maximum: 20 },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_product',
    description: 'Full details for one product: description, materials, size, care, stock and gift notes.',
    inputSchema: {
      type: 'object',
      properties: { product_id: { type: 'string' } },
      required: ['product_id'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_checkout',
    description:
      'Prepare a PayPal checkout for the buyer. Creates a PayPal order with these line items plus the shop\'s flat shipping fee, and returns a PayPal approval link. ' +
      'You cannot pay on the buyer\'s behalf: give the buyer the link so they can review and approve the payment in PayPal themselves.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string' },
              quantity: { type: 'integer', minimum: 1, maximum: 10 },
            },
            required: ['product_id'],
          },
        },
        note_for_seller: { type: 'string', description: 'Optional short note, e.g. "gift, please no price tag"' },
      },
      required: ['items'],
    },
  },
  {
    name: 'get_order_status',
    description: 'Check whether the buyer has approved and paid a checkout created with create_checkout.',
    inputSchema: {
      type: 'object',
      properties: { order_id: { type: 'string' } },
      required: ['order_id'],
    },
    annotations: { readOnlyHint: true },
  },
];

export class ToolError extends Error {}

const text = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }], structuredContent: obj });

function publicProduct(shop, p, { full = false } = {}) {
  const base = {
    product_id: p.id,
    title: p.title,
    price_usd: p.priceCents / 100,
    price: fmt(p.priceCents),
    in_stock: p.stock > 0,
    summary: p.summary,
    tags: p.tags,
    url: `${process.env.BASE_URL || ''}/s/${shop.slug}#${p.id}`,
  };
  if (!full) return base;
  return {
    ...base,
    description: p.description,
    attributes: p.attributes,
    gift_for: p.giftFor,
    stock: p.stock,
    shipping: `${fmt(shop.shippingCents)} flat, ${shop.shipsFrom ? `ships from ${shop.shipsFrom}` : 'ships in 2 to 4 days'}`,
    image_url: p.imageUrl ? `${process.env.BASE_URL || ''}${p.imageUrl}` : null,
  };
}

function score(p, words) {
  if (!words.length) return 1;
  const hay = [p.title, p.summary, p.description, p.category, ...(p.tags || []), ...(p.giftFor || []), ...Object.values(p.attributes || {})]
    .join(' ')
    .toLowerCase();
  return words.reduce((s, w) => s + (hay.includes(w) ? (p.title.toLowerCase().includes(w) ? 3 : 1) : 0), 0);
}

const STOP = new Set(['a', 'an', 'the', 'for', 'of', 'to', 'and', 'or', 'with', 'my', 'me', 'find', 'gift', 'someone', 'who', 'loves', 'lover', 'under', 'something']);

async function search_products(shop, args) {
  const words = String(args.query || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/s$/, ''));
  const max = typeof args.max_price_usd === 'number' ? Math.round(args.max_price_usd * 100) : Infinity;
  const limit = Math.min(Math.max(args.limit || 5, 1), 20);
  const all = store.shopProducts(shop.slug).filter((p) => p.priceCents <= max);
  const ranked = all
    .map((p) => ({ p, s: score(p, words) }))
    .filter((r) => r.s > 0 || !words.length)
    .sort((a, b) => b.s - a.s || a.p.priceCents - b.p.priceCents);
  const results = (ranked.length ? ranked : all.map((p) => ({ p, s: 0 }))).slice(0, limit).map((r) => publicProduct(shop, r.p));
  return text({
    shop: shop.name,
    currency: 'USD',
    flat_shipping_usd: shop.shippingCents / 100,
    matched: ranked.length,
    note: ranked.length ? undefined : 'No direct match; showing products within budget instead.',
    results,
  });
}

async function get_product(shop, args) {
  const p = store.getProduct(shop.slug, args.product_id);
  if (!p) throw new ToolError(`No product with id ${args.product_id} in this shop.`);
  return text(publicProduct(shop, p, { full: true }));
}

async function create_checkout(shop, args, ctx) {
  const lines = (args.items || []).map((it) => {
    const p = store.getProduct(shop.slug, it.product_id);
    if (!p) throw new ToolError(`No product with id ${it.product_id} in this shop.`);
    const quantity = Math.min(Math.max(parseInt(it.quantity ?? 1, 10) || 1, 1), 10);
    if (p.stock < quantity) throw new ToolError(`${p.title} has only ${p.stock} in stock.`);
    return { product: p, quantity };
  });
  if (!lines.length) throw new ToolError('items must contain at least one product.');

  const id = store.newId('ord');
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const items = lines.map(({ product, quantity }) => ({
    productId: product.id,
    title: product.title,
    quantity,
    unitCents: product.priceCents,
    paypalProductId: product.paypalProductId || null,
  }));
  const itemCents = items.reduce((s, i) => s + i.unitCents * i.quantity, 0);

  const pp = await paypal.createOrder({
    referenceId: id,
    brandName: shop.name,
    description: `${shop.name} order ${id}`,
    items: items.map((i) => ({ name: i.title, sku: i.productId, quantity: i.quantity, unitCents: i.unitCents })),
    shippingCents: shop.shippingCents,
    returnUrl: `${base}/s/${shop.slug}/paypal/return?order=${id}`,
    cancelUrl: `${base}/s/${shop.slug}/paypal/cancel?order=${id}`,
  });

  const order = store.addOrder({
    id,
    shopSlug: shop.slug,
    channel: ctx.channel,
    sessionId: ctx.sessionId || null,
    agent: ctx.agent || null,
    items,
    itemCents,
    shippingCents: shop.shippingCents,
    totalCents: itemCents + shop.shippingCents,
    note: args.note_for_seller?.slice(0, 280) || null,
    paypalOrderId: pp.id,
    paypalStatus: pp.status,
    approveUrl: pp.approveUrl,
    status: 'awaiting_buyer',
    createdAt: new Date().toISOString(),
  });

  return text({
    order_id: order.id,
    paypal_order_id: pp.id,
    status: 'awaiting_buyer_approval',
    items: items.map((i) => ({ title: i.title, quantity: i.quantity, unit_price: fmt(i.unitCents) })),
    shipping: fmt(order.shippingCents),
    total: fmt(order.totalCents),
    approve_url: pp.approveUrl,
    next_step:
      'Show the buyer approve_url. They review and pay in PayPal; you never see their payment details. Then call get_order_status with order_id.',
  });
}

/** Captures the PayPal order if the buyer approved it. Shared by the return URL and get_order_status. */
export async function settleOrder(order) {
  if (order.status === 'paid' || order.status === 'cancelled') return order;
  let pp;
  try {
    pp = await paypal.getOrder(order.paypalOrderId);
  } catch (err) {
    return store.updateOrder(order.id, { lastError: err.message });
  }
  if (pp.status === 'APPROVED') {
    const cap = await paypal.captureOrder(order.paypalOrderId);
    return store.updateOrder(order.id, {
      status: cap.captureStatus === 'COMPLETED' ? 'paid' : 'capture_pending',
      paypalStatus: cap.status,
      captureId: cap.captureId,
      captureStatus: cap.captureStatus,
      payerName: cap.payerName,
      payerEmail: cap.payerEmail,
      paidAt: new Date().toISOString(),
    });
  }
  if (pp.status === 'COMPLETED') {
    const capture = pp.purchase_units?.[0]?.payments?.captures?.[0];
    return store.updateOrder(order.id, { status: 'paid', paypalStatus: pp.status, captureId: capture?.id || order.captureId });
  }
  return store.updateOrder(order.id, { paypalStatus: pp.status });
}

async function get_order_status(shop, args) {
  let order = store.getOrder(args.order_id);
  if (!order || order.shopSlug !== shop.slug) throw new ToolError(`No order with id ${args.order_id} in this shop.`);
  order = await settleOrder(order);
  return text({
    order_id: order.id,
    status: order.status === 'paid' ? 'paid' : order.status === 'cancelled' ? 'cancelled' : 'awaiting_buyer_approval',
    paypal_order_id: order.paypalOrderId,
    paypal_capture_id: order.captureId || null,
    total: fmt(order.totalCents),
  });
}

const IMPL = { search_products, get_product, create_checkout, get_order_status };

/** Run a tool. ctx: { channel: 'webmcp'|'mcp'|'web', sessionId, agent }. Always logs to the activity trail. */
export async function runTool(shop, name, args = {}, ctx = {}) {
  const fn = IMPL[name];
  if (!fn) throw new ToolError(`Unknown tool ${name}.`);
  try {
    const result = await fn(shop, args, ctx);
    const s = result.structuredContent || {};
    store.logActivity({
      shopSlug: shop.slug,
      sessionId: ctx.sessionId || null,
      channel: ctx.channel,
      agent: ctx.agent || null,
      tool: name,
      args,
      ok: true,
      summary: summarize(name, s),
    });
    return result;
  } catch (err) {
    store.logActivity({ shopSlug: shop.slug, sessionId: ctx.sessionId || null, channel: ctx.channel, agent: ctx.agent || null, tool: name, args, ok: false, summary: err.message });
    if (err instanceof ToolError || err instanceof paypal.PayPalError) {
      return { content: [{ type: 'text', text: err.message }], isError: true };
    }
    throw err;
  }
}

function summarize(name, s) {
  switch (name) {
    case 'search_products':
      return s.results?.length ? `Found ${s.results.length}: ${s.results.map((r) => `${r.title}, ${r.price}`).join('; ')}` : 'Nothing matched';
    case 'get_product':
      return `${s.title}, ${s.price}`;
    case 'create_checkout':
      return `${s.total} checkout ready in PayPal (order ${s.paypal_order_id})`;
    case 'get_order_status':
      return s.status === 'paid' ? `Paid${s.paypal_capture_id ? ` (payment ${s.paypal_capture_id})` : ''}` : 'Not paid yet';
    default:
      return '';
  }
}
