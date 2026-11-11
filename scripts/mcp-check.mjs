// Connects to a shop's MCP endpoint as a real MCP client, lists tools and runs a search.
// With --checkout it also reads the first result, creates a PayPal sandbox checkout and checks its status.
// Usage: node scripts/mcp-check.mjs [baseUrl] [shopSlug] [--checkout]
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const BASE = (positional[0] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SHOP = positional[1] || 'corner-stall';
const CHECKOUT = args.includes('--checkout');

const client = new Client({ name: 'stallfront-mcp-check', version: '0.1.0' });
const parse = (res) => {
  if (res.isError) throw new Error(res.content?.[0]?.text || 'tool error');
  return res.structuredContent || JSON.parse(res.content[0].text);
};
let failed = 0;
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp/${SHOP}`)));
  const { tools } = await client.listTools();
  console.log(`ok   tools/list: ${tools.map((t) => t.name).join(', ')}`);
  const found = parse(await client.callTool({ name: 'search_products', arguments: { query: 'phone stand', max_price_usd: 100 } }));
  console.log(`ok   tools/call search_products: ${found.results.map((r) => `${r.title} ${r.price}`).join('; ')}`);
  console.log(`     server instructions: ${(client.getInstructions() || '').slice(0, 90)}…`);

  if (CHECKOUT) {
    const first = found.results[0];
    const product = parse(await client.callTool({ name: 'get_product', arguments: { product_id: first.product_id } }));
    console.log(`ok   tools/call get_product: ${product.title} ${product.price}, stock ${product.stock}`);
    const order = parse(
      await client.callTool({
        name: 'create_checkout',
        arguments: { items: [{ product_id: first.product_id, quantity: 1 }], note_for_seller: 'MCP check' },
      }),
    );
    if (!order.approve_url?.includes('paypal.com')) throw new Error('create_checkout returned no PayPal approve_url');
    console.log(`ok   tools/call create_checkout: ${order.order_id}, PayPal ${order.paypal_order_id}, total ${order.total}`);
    console.log(`     approve_url: ${order.approve_url}`);
    const status = parse(await client.callTool({ name: 'get_order_status', arguments: { order_id: order.order_id } }));
    console.log(`ok   tools/call get_order_status: ${status.status}`);
  }
} catch (err) {
  failed++;
  console.log(`FAIL ${err.message}`);
} finally {
  await client.close().catch(() => {});
}
console.log(failed ? '\nMCP check failed' : '\nMCP check passed');
process.exit(failed ? 1 : 0);
