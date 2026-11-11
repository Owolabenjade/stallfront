// Tests for the shop tools against a temporary copy of the demo seed. No network calls:
// every case here fails or answers before PayPal would be reached.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let store;
let tools;
let shop;
const data = (result) => result.structuredContent ?? JSON.parse(result.content[0].text);

before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stallfront-test-'));
  fs.copyFileSync(path.resolve('data/seed.json'), path.join(dir, 'seed.json'));
  process.env.DATA_DIR = dir; // read when store.js is first imported
  store = await import('../server/store.js');
  tools = await import('../server/tools.js');
  store.load({ reset: true });
  shop = store.getShop('corner-stall');
});

test('the four tools are defined once and shared by WebMCP and MCP', () => {
  assert.deepEqual(tools.TOOL_DEFS.map((t) => t.name), ['search_products', 'get_product', 'create_checkout', 'get_order_status']);
});

test('search_products keeps item prices within the budget', async () => {
  const r = data(await tools.runTool(shop, 'search_products', { query: '', max_price_usd: 13 }, { channel: 'webmcp' }));
  assert.ok(r.results.length > 0);
  for (const p of r.results) assert.ok(p.price_usd <= 13, `${p.title} costs ${p.price}`);
});

test('search_products ranks a title match first', async () => {
  const r = data(await tools.runTool(shop, 'search_products', { query: 'phone stand' }, { channel: 'mcp' }));
  assert.match(r.results[0].title, /Stand/);
});

test('get_product rejects an unknown product as a tool error, not an exception', async () => {
  const r = await tools.runTool(shop, 'get_product', { product_id: 'prd_nope' }, { channel: 'mcp' });
  assert.equal(r.isError, true);
});

test('create_checkout refuses unknown products and quantities above stock before calling PayPal', async () => {
  const unknown = await tools.runTool(shop, 'create_checkout', { items: [{ product_id: 'prd_nope' }] }, { channel: 'webmcp' });
  assert.equal(unknown.isError, true);
  const stand = store.shopProducts('corner-stall').find((p) => /Stand/.test(p.title));
  const tooMany = await tools.runTool(shop, 'create_checkout', { items: [{ product_id: stand.id, quantity: stand.stock + 1 }] }, { channel: 'webmcp' });
  assert.equal(tooMany.isError, true);
  assert.equal(store.shopOrders('corner-stall').length, 0);
});

test('every tool call is logged with its channel for the seller view', async () => {
  await tools.runTool(shop, 'search_products', { query: 'mug' }, { channel: 'mcp', sessionId: 's1', agent: 'test client 1.0' });
  const trace = store.sessionTrace('corner-stall', 's1');
  assert.equal(trace.at(-1).tool, 'search_products');
  assert.equal(trace.at(-1).channel, 'mcp');
});
