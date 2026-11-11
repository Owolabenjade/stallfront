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
    // Groq's own messages name our organization and plan, so they stay in the server log; clients get a plain message.
    const detail = json.error?.message || `Groq request failed (${res.status})`;
    if (res.status !== 429) console.warn(`Groq ${res.status} (${body.model}): ${detail.slice(0, 300)}`);
    const busy = res.status === 429;
    throw httpError(busy ? 429 : 502, busy ? 'The free AI plan is busy right now; wait a few seconds and try again.' : 'The AI service could not complete this request.', {
      retryAfter,
      upstream: true,
      failedGeneration: json.error?.failed_generation || null,
    });
  }
  return { json, limits: { tokens: res.headers.get('x-ratelimit-limit-tokens'), requests: res.headers.get('x-ratelimit-limit-requests') } };
}

// ---------- buyer agent ----------

export function agentSystem(shop) {
  return [
    `You are a shopping assistant working for a buyer who is browsing ${shop.name}, a small independent shop (${shop.tagline || 'handmade and everyday goods'}).`,
    'Use the shop tools: search_products, get_product, create_checkout, get_order_status. Never invent products, prices, stock or qualities: describe items only with what the tools return.',
    `Prices are USD. Shipping is a flat $${(shop.shippingCents / 100).toFixed(2)} per order. With a budget, keep item prices within it and say whether shipping is extra.`,
    'When the buyer asks you to find, get, pick or buy something, choose the best fit and call create_checkout in the same turn, without asking for confirmation first: the buyer approves the payment in PayPal themselves, so a prepared checkout commits them to nothing. Ask a question instead only when nothing in the shop fits. Then say why you chose it in one or two sentences. There is no cart: the checkout is the next step.',
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
  const turn = await completeTurn(messages);
  if (!announcesWithoutActing(turn.message)) return turn;
  // The model said it would act ("I'll create a checkout…") but called no tool. Remind it once; the reminder
  // is not stored in the buyer's transcript.
  const retry = await completeTurn([...messages, { role: 'assistant', content: turn.message.content }, { role: 'system', content: NUDGE }]);
  return retry.message.tool_calls?.length ? { ...retry, nudged: true } : turn;
}

const NUDGE = 'Reminder from the shop page: your last reply said you would do something but called no tool. Call the tool now, in this turn.';
const ANNOUNCE = /\b(I['’]ll|I will|I['’]m going to|I am going to|let me|I['’]m now|now I['’]ll)\s+(now\s+|go ahead and\s+|just\s+)?(create|prepare|set up|place|start|search|look|check|get|find|add)\b/i;

/** True when a reply promises an action but carries no tool call. Exported for the check script. */
export function announcesWithoutActing(message) {
  return !message.tool_calls?.length && ANNOUNCE.test(message.content || '');
}

/** One model call with the full message list (system prompt included), falling back to the smaller model on 429. */
export async function completeTurn(messages) {
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
// The schema can't use enum (Groq strict mode rejects it), so the category is mapped here.
const CATEGORIES = ['kitchen', 'home', 'bags', 'apparel', 'accessories', 'electronics', 'art', 'stationery', 'beauty', 'toys', 'other'];
const CATEGORY_ALIASES = { drinkware: 'kitchen', tableware: 'kitchen', glassware: 'kitchen', mug: 'kitchen', luggage: 'bags', bag: 'bags', clothing: 'apparel', jewelry: 'accessories', jewellery: 'accessories', gadgets: 'electronics', tech: 'electronics', office: 'stationery', decor: 'home', furniture: 'home' };

function normalize(l) {
  const attrs = l.attributes && typeof l.attributes === 'object' ? l.attributes : {};
  return {
    title: String(l.title || 'Untitled product').slice(0, 80),
    summary: String(l.summary || '').slice(0, 160),
    description: String(l.description || '').slice(0, 800),
    category: CATEGORIES.find((c) => String(l.category || '').toLowerCase().includes(c)) || CATEGORY_ALIASES[String(l.category || '').toLowerCase()] || 'other',
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
    'Write the listing for the main object. Describe only what you can see or reasonably infer, and put anything you cannot confirm in needs_seller_check instead of stating it as fact. ' +
    'Describe the product, not the photo: never mention hands, tables, stools, surfaces or backgrounds. ' +
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
