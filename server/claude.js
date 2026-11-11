// Claude calls: one buyer-agent turn (the browser runs the tools through WebMCP) and photo-to-listing drafts.
import Anthropic from '@anthropic-ai/sdk';
import { TOOL_DEFS } from './tools.js';

export const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

let client = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('The AI assistant is not configured on this server (ANTHROPIC_API_KEY missing).');
    err.status = 503;
    throw err;
  }
  client ??= new Anthropic();
  return client;
}

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// ---------- buyer agent ----------

function agentSystem(shop) {
  return [
    `You are a shopping assistant working for a buyer who is browsing ${shop.name}, a small independent shop (${shop.tagline || 'handmade goods'}).`,
    'The shop exposes tools: search_products, get_product, create_checkout and get_order_status. Use them; do not invent products, prices or stock.',
    `Prices are in USD. Shipping is a flat $${(shop.shippingCents / 100).toFixed(2)} per order. When the buyer gives a budget, keep the item prices within it and say whether shipping is on top.`,
    'If the buyer asks you to find something to buy, pick the best fit, say in one or two sentences why, then call create_checkout to prepare the order. The buyer reviews and approves the payment in PayPal themselves, so preparing the checkout commits them to nothing.',
    'Never say an order is paid or placed until get_order_status reports paid. You never see or handle payment details.',
    'After create_checkout succeeds, tell the buyer the total and to press "Review and pay in PayPal". Keep every reply short: two to four sentences of plain text, no headings, lists of at most three items.',
  ].join('\n');
}

const ALLOWED_BLOCKS = new Set(['text', 'tool_use', 'tool_result', 'thinking', 'redacted_thinking', 'fallback']);

/** Validate the browser-held transcript before forwarding it. Throws with status 400 on anything unexpected. */
function checkMessages(messages) {
  const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
  if (!Array.isArray(messages) || !messages.length) throw bad('messages must be a non-empty array');
  if (messages.length > 40) throw bad('This conversation is too long; reload the page to start a new one.');
  if (JSON.stringify(messages).length > 200_000) throw bad('Conversation too large.');
  for (const m of messages) {
    if (m.role !== 'user' && m.role !== 'assistant') throw bad('Unexpected message role');
    if (typeof m.content === 'string') {
      if (m.content.length > 600) throw bad('Message too long (600 characters max).');
      continue;
    }
    if (!Array.isArray(m.content)) throw bad('Unexpected message content');
    for (const b of m.content) if (!ALLOWED_BLOCKS.has(b?.type)) throw bad(`Unexpected content block ${b?.type}`);
  }
  if (messages[0].role !== 'user') throw bad('The first message must come from the buyer');
}

/**
 * One Messages API turn. The tool list always comes from the server's own definitions (the same ones the page
 * registers with WebMCP), so the endpoint cannot be used as a general-purpose model proxy.
 */
export async function agentTurn(shop, messages) {
  checkMessages(messages);
  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    ...FALLBACK,
    output_config: { effort: 'low' },
    system: agentSystem(shop),
    tools: TOOL_DEFS.map(({ name, description, inputSchema }) => ({ name, description, input_schema: inputSchema })),
    messages,
  });
  return {
    content: response.content,
    stop_reason: response.stop_reason,
    model: response.model,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}

// ---------- photo to listing ----------

const LISTING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['listings'],
  properties: {
    listings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['photo_index', 'title', 'summary', 'description', 'category', 'price_usd', 'price_reasoning', 'attributes', 'tags', 'gift_for', 'needs_seller_check'],
        properties: {
          photo_index: { type: 'integer', description: '1-based index of the photo this listing describes' },
          title: { type: 'string', description: 'Plain product title, 3 to 8 words, no hype' },
          summary: { type: 'string', description: 'One sentence a buyer reads on the product card, under 110 characters' },
          description: { type: 'string', description: 'Two to four factual sentences: what it is, how it is made or used, size and care if visible' },
          category: { type: 'string', enum: ['kitchen', 'tea', 'home', 'apparel', 'jewelry', 'art', 'stationery', 'beauty', 'toys', 'other'] },
          price_usd: { type: 'number', description: 'Suggested retail price for a small independent maker, in USD' },
          price_reasoning: { type: 'string', description: 'One short sentence on why this price' },
          attributes: {
            type: 'object',
            additionalProperties: false,
            required: ['material', 'color', 'size'],
            properties: {
              material: { type: 'string' },
              color: { type: 'string' },
              size: { type: 'string', description: 'Estimated size or capacity, or "unknown"' },
            },
          },
          tags: { type: 'array', items: { type: 'string' }, description: '4 to 8 lowercase search words a shopper or an AI agent might use' },
          gift_for: { type: 'array', items: { type: 'string' }, description: '2 to 4 kinds of people or occasions this suits, e.g. "tea lovers", "housewarming"' },
          needs_seller_check: { type: 'array', items: { type: 'string' }, description: 'Facts the photo cannot confirm and the seller should check, e.g. "dishwasher safe?"' },
        },
      },
    },
  },
};

/**
 * photos: [{ mediaType: 'image/jpeg'|'image/png'|'image/webp', data: base64 }]. hint: optional seller note.
 * Returns { listings: [...] } validated by structured output.
 */
export async function draftListings(photos, hint) {
  const content = [];
  photos.forEach((p, i) => {
    content.push({ type: 'text', text: `Photo ${i + 1}:` });
    content.push({ type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.data } });
  });
  content.push({
    type: 'text',
    text:
      'These are product photos from a small independent seller who wants to list them in an online shop that AI shopping agents will search. ' +
      'Write one listing per photo, in photo order. Describe only what you can see or reasonably infer; put anything you cannot confirm in needs_seller_check rather than stating it as fact. ' +
      'Make titles and tags concrete (material, object, use), because agents match on them.' +
      (hint ? `\nSeller's note: ${String(hint).slice(0, 500)}` : ''),
  });
  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: LISTING_SCHEMA } },
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('The model declined to describe these photos.'), { status: 422 });
  }
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw Object.assign(new Error('No listing text came back from the model.'), { status: 502 });
  const parsed = JSON.parse(text);
  return { listings: parsed.listings, model: response.model, usage: { input: response.usage.input_tokens, output: response.usage.output_tokens } };
}
