// Connects to a shop's MCP endpoint as a real MCP client, lists tools and runs a search.
// Usage: node scripts/mcp-check.mjs [baseUrl] [shopSlug]
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SHOP = process.argv[3] || 'corner-stall';
const client = new Client({ name: 'stallfront-mcp-check', version: '0.1.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp/${SHOP}`)));
const { tools } = await client.listTools();
console.log(`ok   tools/list: ${tools.map((t) => t.name).join(', ')}`);
const res = await client.callTool({ name: 'search_products', arguments: { query: 'phone stand', max_price_usd: 100 } });
const data = res.structuredContent || JSON.parse(res.content[0].text);
console.log(`ok   tools/call search_products: ${data.results.map((r) => `${r.title} ${r.price}`).join('; ')}`);
console.log(`     server instructions: ${(client.getInstructions() || '').slice(0, 90)}…`);
await client.close();
