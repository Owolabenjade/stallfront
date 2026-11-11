// Minimal PayPal REST client (sandbox by default): OAuth, Orders v2, Catalog Products.
import crypto from 'node:crypto';

const BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

export class PayPalError extends Error {
  constructor(message, { status = 502, debugId = null, details = null } = {}) {
    super(message);
    this.name = 'PayPalError';
    this.status = status;
    this.debugId = debugId;
    this.details = details;
  }
}

export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken = null;

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  if (!paypalConfigured()) {
    throw new PayPalError('PayPal is not configured: set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.', { status: 503 });
  }
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PayPalError(`PayPal auth failed (${res.status}): ${json.error_description || json.error || 'unknown error'}`, { status: 502 });
  }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

async function call(method, path, body, { requestId } = {}) {
  const token = await accessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  if (requestId) headers['PayPal-Request-Id'] = requestId;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const issue = json.details?.[0]?.issue || json.name || 'UNKNOWN';
    throw new PayPalError(`PayPal ${method} ${path} failed (${res.status} ${issue})`, {
      status: res.status >= 500 ? 502 : res.status,
      debugId: json.debug_id || res.headers.get('paypal-debug-id'),
      details: json.details || json,
    });
  }
  return json;
}

export const money = (cents, currency = 'USD') => ({ currency_code: currency, value: (cents / 100).toFixed(2) });

/**
 * Create a CAPTURE order with line items. Returns { id, status, approveUrl }.
 * items: [{ name, sku, quantity, unitCents, description }]
 */
export async function createOrder({ referenceId, brandName, description, items, shippingCents, returnUrl, cancelUrl, currency = 'USD' }) {
  const itemTotal = items.reduce((sum, i) => sum + i.unitCents * i.quantity, 0);
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: referenceId,
        custom_id: referenceId,
        description: description?.slice(0, 127),
        amount: {
          ...money(itemTotal + shippingCents, currency),
          breakdown: { item_total: money(itemTotal, currency), shipping: money(shippingCents, currency) },
        },
        items: items.map((i) => ({
          name: i.name.slice(0, 127),
          sku: i.sku?.slice(0, 127),
          description: i.description?.slice(0, 127),
          quantity: String(i.quantity),
          unit_amount: money(i.unitCents, currency),
          category: 'PHYSICAL_GOODS',
        })),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: brandName?.slice(0, 127),
          shipping_preference: 'GET_FROM_FILE',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    },
  };
  const order = await call('POST', '/v2/checkout/orders', body, { requestId: `create-${referenceId}` });
  const approve = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  return { id: order.id, status: order.status, approveUrl: approve?.href, raw: order };
}

export async function getOrder(id) {
  return call('GET', `/v2/checkout/orders/${encodeURIComponent(id)}`);
}

/** Capture an approved order. Idempotent per order through PayPal-Request-Id. */
export async function captureOrder(id) {
  const order = await call('POST', `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {}, { requestId: `capture-${id}` });
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  const payer = order.payer || {};
  return {
    status: order.status,
    captureId: capture?.id || null,
    captureStatus: capture?.status || null,
    payerName: [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ') || null,
    payerEmail: payer.email_address || null,
    raw: order,
  };
}

/** Create a PayPal Catalog product. Returns the PayPal product ID. */
export async function createCatalogProduct({ name, description, imageUrl, homeUrl, category }) {
  const body = {
    name: name.slice(0, 127),
    description: description?.slice(0, 256),
    type: 'PHYSICAL',
    ...(category ? { category } : {}),
    ...(imageUrl?.startsWith('https://') ? { image_url: imageUrl } : {}),
    ...(homeUrl?.startsWith('https://') ? { home_url: homeUrl } : {}),
  };
  const product = await call('POST', '/v1/catalogs/products', body, { requestId: `product-${crypto.randomUUID()}` });
  return product.id;
}
