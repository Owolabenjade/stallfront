// Remote MCP endpoint per shop: /mcp/<slug>, Streamable HTTP, stateful sessions.
// Serves the same tool definitions the shop page registers with WebMCP, so any MCP client
// (Claude Desktop, Claude Code, other agents) can shop without a browser.
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema, isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import * as store from './store.js';
import { TOOL_DEFS, runTool } from './tools.js';

const sessions = new Map(); // sessionId -> { transport, shopSlug, lastSeen }
const IDLE_MS = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) if (now - s.lastSeen > IDLE_MS) s.transport.close().catch(() => {});
}, 5 * 60 * 1000).unref();

function buildServer(shop) {
  const server = new Server(
    { name: `stallfront-${shop.slug}`, version: '0.1.0' },
    {
      capabilities: { tools: {} },
      instructions:
        `Tools for shopping at ${shop.name} (${shop.tagline || 'an independent shop'}), a Stallfront shop. ` +
        'Search, read product details, then create_checkout to prepare a PayPal order. You cannot pay: give the buyer approve_url so they approve the payment in PayPal, then check get_order_status.',
    },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFS.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, ...(annotations ? { annotations } : {}) })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const client = server.getClientVersion();
    const current = store.getShop(shop.slug) || shop;
    return runTool(current, request.params.name, request.params.arguments || {}, {
      channel: 'mcp',
      sessionId: extra.sessionId || null,
      agent: client ? `${client.name}${client.version ? ` ${client.version}` : ''}` : 'MCP client',
    });
  });
  return server;
}

const rpcError = (res, status, message) => res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });

export function mountMcp(app) {
  app.post('/mcp/:slug', async (req, res) => {
    const shop = store.getShop(req.params.slug);
    if (!shop) return rpcError(res, 404, `No shop called ${req.params.slug}`);
    const sid = req.get('mcp-session-id');
    let entry = sid ? sessions.get(sid) : null;
    if (!entry) {
      if (sid) return rpcError(res, 404, 'Session expired; reconnect.');
      if (!isInitializeRequest(req.body)) return rpcError(res, 400, 'Send initialize first.');
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => sessions.set(id, { transport, shopSlug: shop.slug, lastSeen: Date.now() }),
      });
      transport.onclose = () => transport.sessionId && sessions.delete(transport.sessionId);
      await buildServer(shop).connect(transport);
      entry = { transport, shopSlug: shop.slug };
    }
    if (entry.shopSlug !== shop.slug) return rpcError(res, 400, 'Session belongs to another shop.');
    entry.lastSeen = Date.now();
    try {
      await entry.transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('MCP error', err);
      if (!res.headersSent) rpcError(res, 500, 'MCP server error');
    }
  });

  const sessionRoute = async (req, res) => {
    const entry = sessions.get(req.get('mcp-session-id') || '');
    if (!entry || entry.shopSlug !== req.params.slug) return rpcError(res, 404, 'Unknown session');
    entry.lastSeen = Date.now();
    await entry.transport.handleRequest(req, res);
  };
  app.get('/mcp/:slug', sessionRoute);
  app.delete('/mcp/:slug', sessionRoute);
}
