// AI calls through Groq's OpenAI-compatible API (free plan): the buyer agent's turns and photo-to-listing drafts.
import { TOOL_DEFS } from './tools.js';

const BASE = process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1';
export const AGENT_MODELS = (process.env.GROQ_AGENT_MODELS || 'openai/gpt-oss-120b,openai/gpt-oss-20b').split(',');
export const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b';

export const aiConfigured = () => Boolean(process.env.GROQ_API_KEY);

const httpError = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

async function chat(body) {
  if (!aiConfigured()) throw httpError(503, 'The AI assistant is not configured on this server (GROQ_API_KEY missing).');
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const retryAfter = Number(res.headers.get('retry-after')) || null;
    const msg = json.error?.message || `Groq request failed (${res.status})`;
    throw httpError(res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status, msg, { retryAfter, upstream: true, failedGeneration: json.error?.failed_generation || null });
  }
  return { json, limits: { tokens: res.headers.get('x-ratelimit-limit-tokens'), requests: res.headers.get('x-ratelimit-limit-requests') } };
}

// ---------- buyer agent ----------

function agentSystem(shop) {
  return [
    `You are a shopping assistant working for a buyer who is browsing ${shop.name}, a small independent shop (${shop.tagline || 'handmade and everyday goods'}).`,
    'Use the shop tools: search_products, get_product, create_checkout, get_order_status. Never invent products, prices, stock or qualities: describe items only with what the tools return.',
    `Prices are USD. Shipping is a flat $${(shop.shippingCents / 100).toFixed(2)} per order. With a budget, keep item prices within it and say whether shipping is extra.`,
    'If the buyer wants to buy something, pick the best fit, say why in one or two sentences, then call create_checkout. The buyer approves the payment in PayPal themselves, so preparing a checkout commits them to nothing.',
    'Never say an order is paid until get_order_status reports paid. You never see payment details.',
    'After create_checkout succeeds, give the total and tell the buyer to press the "Review and pay in PayPal" button on the page. Do not paste the approve_url: the page already shows it as that button. Replies: two to four short sentences of plain text, no markdown tables or headings.',
  ].join('\n');
}

const TOOLS = TOOL_DEFS.map(({ name, description, inputSchema }) => ({ type: 'function', function: { name, description, parameters: inputSchema } }));
const TOOL_NAMES = new Set(TOOL_DEFS.map((t) => t.name));

/** Validate the browser-held transcript (OpenAI chat format) before forwarding it. */
function checkMessages(messages) {
  const bad = (m) => httpError(400, m);
  if (!Array.isArray(messages) || !messages.length) throw bad('messages must be a non-empty array');
  if (messages.length > 40) throw bad('This conversation is too long; reload the page to start a new one.');
  if (JSON.stringify(messages).length > 120_000) throw bad('Conversation too large.');
  if (messages[0].role !== 'user') throw bad('The first message must come from the buyer');
  return messages.map((m) => {
    if (m.role === 'user') {
      if (typeof m.content !== 'string' || m.content.length > 600) throw bad('Buyer messages are plain text, 600 characters at most.');
      return { role: 'user', content: m.content };
    }
    if (m.role === 'assistant') {
      const calls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      for (const c of calls) if (!TOOL_NAMES.has(c?.function?.name)) throw bad('Unknown tool in transcript');
      return { role: 'assistant', content: typeof m.content === 'string' ? m.content : '', ...(calls.length ? { tool_calls: calls.map((c) => ({ id: String(c.id), type: 'function', function: { name: c.function.name, arguments: String(c.function.arguments ?? '{}') } })) } : {}) };
    }
    if (m.role === 'tool') {
      return { role: 'tool', tool_call_id: String(m.tool_call_id), content: String(m.content ?? '').slice(0, 12_000) };
    }
    throw bad('Unexpected message role');
  });
}

/**
 * One agent turn. Tools always come from the server's own definitions (the same ones the page registers with
 * WebMCP), so this endpoint cannot be used as a general-purpose model proxy. Falls back to a smaller model on 429.
 */
export async function agentTurn(shop, rawMessages) {
  const messages = [{ role: 'system', content: agentSystem(shop) }, ...checkMessages(rawMessages)];
  let lastErr;
  for (const model of AGENT_MODELS) {
    try {
      const { json } = await chat({ model, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.3, max_completion_tokens: 1200, reasoning_effort: 'low' });
      const msg = json.choices?.[0]?.message || {};
      return {
        message: {
          role: 'assistant',
          content: msg.content || '',
          ...(msg.tool_calls?.length ? { tool_calls: msg.tool_calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.function.name, arguments: c.function.arguments } })) } : {}),
        },
        finish_reason: json.choices?.[0]?.finish_reason,
        model: json.model || model,
        usage: json.usage ? { input: json.usage.prompt_tokens, output: json.usage.completion_tokens } : null,
      };
    } catch (err) {
      lastErr = err;
      if (err.status !== 429) throw err;
    }
  }
  throw httpError(429, 'The free AI plan is busy right now; wait a few seconds and ask again.', { retryAfter: lastErr?.retryAfter });
}

// ---------- photo to listing (one photo per request; the vision model takes at most 3 images) ----------

const LISTING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'description', 'category', 'price_usd', 'price_reasoning', 'attributes', 'tags', 'gift_for', 'needs_seller_check'],
  properties: {
    title: { type: 'string', description: 'Plain product title, 3 to 8 words, no hype' },
    summary: { type: 'string', description: 'One sentence for the product card, under 110 characters' },
    description: { type: 'string', description: 'Two to four factual sentences: what it is, what it is made of, how it is used, size and care if visible' },
    category: { type: 'string', description: 'One of: kitchen, home, bags, apparel, accessories, electronics, art, stationery, beauty, toys, other' },
    price_usd: { type: 'number', description: 'Suggested price in USD for a small independent seller' },
    price_reasoning: { type: 'string', description: 'One short sentence on why this price' },
    attributes: {
      type: 'object',
      additionalProperties: false,
      required: ['material', 'color', 'size'],
      properties: { material: { type: 'string' }, color: { type: 'string' }, size: { type: 'string', description: 'Estimated size or capacity, or "unknown"' } },
    },
    tags: { type: 'array', items: { type: 'string' }, description: '4 to 8 lowercase search words a shopper or an AI agent might use' },
    gift_for: { type: 'array', items: { type: 'string' }, description: '2 to 4 kinds of people or occasions this suits' },
    needs_seller_check: { type: 'array', items: { type: 'string' }, description: 'Facts the photo cannot confirm that the seller should check' },
  },
};

const FIELD_GUIDE =
  'Return one JSON object with exactly these keys: title (3 to 8 words), summary (one sentence under 110 characters), ' +
  'description (2 to 4 factual sentences), category (one of kitchen, home, bags, apparel, accessories, electronics, art, stationery, beauty, toys, other), ' +
  'price_usd (number), price_reasoning (one sentence), attributes (object with material, color, size), tags (4 to 8 lowercase words), ' +
  'gift_for (2 to 4 short phrases), needs_seller_check (list of facts the photo cannot confirm).';

function parseLoose(text) {
  if (!text) return null;
  const s = String(text);
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

const asList = (a) => (Array.isArray(a) ? a : typeof a === 'string' ? a.split(/[,;]/) : []);
const uniq = (a, n) => [...new Set(asList(a).map((s) => String(s).trim().toLowerCase()).filter(Boolean))].slice(0, n);

/** Fill defaults and bound every field; the seller reviews everything before publishing. */
function normalize(l) {
  const attrs = l.attributes && typeof l.attributes === 'object' ? l.attributes : {};
  return {
    title: String(l.title || 'Untitled product').slice(0, 80),
    summary: String(l.summary || '').slice(0, 160),
    description: String(l.description || '').slice(0, 800),
    category: String(l.category || 'other').toLowerCase().slice(0, 30),
    price_usd: Math.min(Math.max(Math.round(Number(l.price_usd || 10) * 2) / 2, 1), 1000),
    price_reasoning: String(l.price_reasoning || '').slice(0, 200),
    attributes: { material: String(attrs.material || 'unknown'), color: String(attrs.color || 'unknown'), size: String(attrs.size || 'unknown') },
    tags: uniq(l.tags, 8),
    gift_for: uniq(l.gift_for, 4),
    needs_seller_check: asList(l.needs_seller_check).map(String).slice(0, 4),
  };
}

/**
 * photo: { mediaType, data(base64) }. Returns one listing. Strict json_schema first; the preview vision model
 * sometimes fails constrained decoding ("Failed to generate JSON"), so fall back to its failed_generation text,
 * then to JSON object mode with the schema described in the prompt.
 */
export async function draftListing(photo, hint) {
  const prompt =
    'This is a product photo from a small independent seller who is listing it in an online shop that AI shopping agents will search. ' +
    'Write the listing for the main object. Describe only what you can see or reasonably infer, ignore the background, and put anything you cannot confirm in needs_seller_check instead of stating it as fact. ' +
    'Use concrete titles and tags (material, object, use) because agents match on them. Return JSON only.' +
    (hint ? `\nSeller's note: ${String(hint).slice(0, 300)}` : '');
  const request = (text, response_format) => ({
    model: VISION_MODEL,
    temperature: 0.2,
    max_completion_tokens: 1500,
    messages: [{ role: 'user', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: `data:${photo.mediaType};base64,${photo.data}` } }] }],
    response_format,
  });

  let raw = null;
  let meta = {};
  let mode = 'json_schema';
  try {
    const { json, limits } = await chat(request(prompt, { type: 'json_schema', json_schema: { name: 'listing', strict: true, schema: LISTING_SCHEMA } }));
    raw = parseLoose(json.choices?.[0]?.message?.content);
    meta = { model: json.model, limits, usage: json.usage };
  } catch (err) {
    if (err.status === 429 || err.status === 503) throw err;
    raw = parseLoose(err.failedGeneration);
    mode = 'failed_generation';
  }
  if (!raw) {
    mode = 'json_object';
    const { json, limits } = await chat(request(`${prompt}\n${FIELD_GUIDE}`, { type: 'json_object' }));
    raw = parseLoose(json.choices?.[0]?.message?.content);
    meta = { model: json.model, limits, usage: json.usage };
  }
  if (!raw) throw httpError(502, 'The AI could not describe this photo; try again or use a clearer photo.');
  return {
    listing: normalize(raw),
    mode,
    model: meta.model || VISION_MODEL,
    limits: meta.limits,
    usage: meta.usage ? { input: meta.usage.prompt_tokens, output: meta.usage.completion_tokens } : null,
  };
}
