// Shop page: renders products, registers the shop's WebMCP tools, and runs the in-page buyer assistant.
const slug = decodeURIComponent(location.pathname.split('/')[2] || '');
const sessionId = crypto.randomUUID();
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

const ICON_PHOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/></svg>';

let shop = null;
let products = [];
let toolDefs = [];
let agentBusy = false;

function notice(kind, html) {
  $('#notice').innerHTML = html ? `<p class="notice ${kind}">${html}</p>` : '';
}

async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

// ---------- tools: one HTTP call per tool run, attributed to a channel ----------
async function callTool(name, args, channel) {
  return api(`/api/shops/${encodeURIComponent(slug)}/tools/${name}`, {
    method: 'POST',
    headers: { 'x-stallfront-channel': channel, 'x-stallfront-session': sessionId, 'x-stallfront-agent': channel === 'webmcp' ? 'in-page or browser agent' : '' },
    body: JSON.stringify(args || {}),
  });
}

function resultData(result) {
  if (result?.structuredContent) return result.structuredContent;
  const text = result?.content?.find((c) => c.type === 'text')?.text;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

function summarizeArgs(name, a) {
  if (name === 'search_products') return [a.query && `"${a.query}"`, a.max_price_usd != null && `max $${a.max_price_usd}`].filter(Boolean).join(', ') || 'all products';
  if (name === 'get_product') return a.product_id;
  if (name === 'create_checkout') return (a.items || []).map((i) => `${i.quantity || 1} x ${i.product_id}`).join(', ');
  if (name === 'get_order_status') return a.order_id;
  return JSON.stringify(a);
}

function summarizeResult(name, r, isError) {
  if (isError) return r.message || 'Tool error';
  if (name === 'search_products') return `${r.results?.length ?? 0} found: ${(r.results || []).map((x) => `${x.title} (${x.price})`).join(', ')}`;
  if (name === 'get_product') return `${r.title}, ${r.price}, ${r.stock} in stock`;
  if (name === 'create_checkout') return `PayPal order ${r.paypal_order_id} created, total ${r.total}`;
  if (name === 'get_order_status') return `${r.status}${r.paypal_capture_id ? `, capture ${r.paypal_capture_id}` : ''}`;
  return '';
}

function traceCall(name, args, result) {
  const r = resultData(result);
  const el = document.createElement('div');
  el.className = `call arrive${result?.isError ? ' err' : ''}`;
  el.innerHTML = `<span class="via">WebMCP</span><span class="tool">${esc(name)}</span>
    <span class="args">${esc(summarizeArgs(name, args))}</span>
    <span class="res">${esc(summarizeResult(name, r, result?.isError))}</span>`;
  chatAppend(el);

  // Show what the agent is looking at.
  const ids = name === 'search_products' ? (r.results || []).map((x) => x.product_id) : name === 'get_product' ? [r.product_id] : [];
  document.querySelectorAll('.product.highlight').forEach((n) => n.classList.remove('highlight'));
  ids.forEach((id) => document.getElementById(id)?.classList.add('highlight'));

  if (name === 'create_checkout' && r.approve_url) showHandoff(r);
}

function showHandoff(r) {
  const el = document.createElement('div');
  el.className = 'handoff arrive';
  el.innerHTML = `
    <div><strong>Checkout ready.</strong> Your assistant prepared this order; you approve the payment in PayPal.</div>
    <div>${(r.items || []).map((i) => `${esc(i.quantity)} × ${esc(i.title)} <span class="num">${esc(i.unit_price)}</span>`).join('<br>')}
      <br>Shipping <span class="num">${esc(r.shipping)}</span></div>
    <div class="total">Total ${esc(r.total)}</div>
    <a class="btn btn-paypal" href="${esc(r.approve_url)}">Review and pay in PayPal</a>`;
  chatAppend(el);
}

async function registerWebMcpTools() {
  const badge = $('#agent-ready');
  const mc = document.modelContext || navigator.modelContext;
  if (!mc?.registerTool) {
    badge.querySelector('span').textContent = 'WebMCP unavailable in this browser';
    return;
  }
  for (const def of toolDefs) {
    await mc.registerTool({
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
      ...(def.annotations ? { annotations: def.annotations } : {}),
      async execute(args) {
        const result = await callTool(def.name, args, 'webmcp').catch((err) => ({ content: [{ type: 'text', text: err.message }], isError: true }));
        traceCall(def.name, args || {}, result);
        return { content: result.content, ...(result.isError ? { isError: true } : {}) };
      },
    });
  }
  const tools = await mc.getTools();
  badge.classList.remove('off');
  badge.querySelector('span').textContent = `Agent-ready: ${tools.length} WebMCP tools on this page`;
  $('#tools').innerHTML = tools.map((t) => `<li><code>${esc(t.name)}</code><span class="muted">${esc(shortDesc(t.description))}</span></li>`).join('');
}

const shortDesc = (d) => (d || '').split('. ')[0].replace(/\.$/, '');

// ---------- products ----------
function renderProducts() {
  const grid = $('#grid');
  grid.removeAttribute('aria-busy');
  if (!products.length) {
    grid.innerHTML = '<p class="muted">This shop has no products yet.</p>';
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
    <article class="product" id="${esc(p.id)}">
      <div class="ph">${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.title)}" loading="lazy">` : ICON_PHOTO}</div>
      <div class="body">
        <h3>${esc(p.title)}</h3>
        <p class="summary">${esc(p.summary)}</p>
        <div class="row">
          <span><span class="price">${money(p.priceCents)}</span> <span class="stock">${p.stock > 0 ? `${p.stock} left` : 'Sold out'}</span></span>
          <button class="btn btn-ghost btn-sm" data-buy="${esc(p.id)}" ${p.stock > 0 ? '' : 'disabled'}>Buy with PayPal</button>
        </div>
      </div>
    </article>`,
    )
    .join('');
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-buy]');
  if (!btn) return;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Opening PayPal…';
  try {
    const result = await callTool('create_checkout', { items: [{ product_id: btn.dataset.buy, quantity: 1 }] }, 'web');
    const r = resultData(result);
    if (result.isError || !r.approve_url) throw new Error(r.message || 'Could not create the PayPal order');
    location.href = r.approve_url;
  } catch (err) {
    notice('err', `Checkout failed: ${esc(err.message)}. Try again in a moment.`);
    btn.removeAttribute('aria-busy');
    btn.textContent = 'Buy with PayPal';
  }
});

// ---------- in-page buyer assistant (model via /api/agent, tools run through WebMCP) ----------
const messages = [];

function chatAppend(el) {
  const chat = $('#chat');
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function renderText(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

async function runAgent(userText) {
  if (agentBusy) return;
  agentBusy = true;
  $('#send').setAttribute('aria-busy', 'true');
  const u = document.createElement('div');
  u.className = 'msg user arrive';
  u.textContent = userText;
  chatAppend(u);
  messages.push({ role: 'user', content: userText });

  // The model only names tools; every call is executed in this page through WebMCP (document.modelContext).
  const mc = document.modelContext || navigator.modelContext;
  const tools = await mc.getTools();
  const thinking = document.createElement('div');
  thinking.className = 'thinking';
  try {
    for (let step = 0; step < 8; step++) {
      thinking.textContent = step === 0 ? 'Assistant is reading the shop…' : 'Assistant is working…';
      chatAppend(thinking);
      let turn;
      for (let attempt = 0; ; attempt++) {
        try {
          turn = await api('/api/agent', { method: 'POST', headers: { 'x-stallfront-session': sessionId }, body: JSON.stringify({ shop: slug, messages }) });
          break;
        } catch (err) {
          if (!/busy|429|Too many/i.test(err.message) || attempt >= 2) throw err;
          thinking.textContent = 'The free AI plan is busy; trying again in a few seconds…';
          await new Promise((r) => setTimeout(r, 6000));
        }
      }
      thinking.remove();
      const msg = turn.message;
      messages.push(msg);
      if (msg.content?.trim()) {
        const a = document.createElement('div');
        a.className = 'msg assistant arrive';
        a.innerHTML = renderText(msg.content);
        chatAppend(a);
      }
      if (!msg.tool_calls?.length) break;
      for (const call of msg.tool_calls) {
        const tool = tools.find((t) => t.name === call.function.name);
        let out;
        try {
          if (!tool) throw new Error(`no WebMCP tool named ${call.function.name}`);
          const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
          const raw = await mc.executeTool(tool, args);
          out = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (err) {
          out = { content: [{ type: 'text', text: `Tool failed: ${err.message}` }], isError: true };
        }
        const text = (out?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
        messages.push({ role: 'tool', tool_call_id: call.id, content: out?.isError ? `ERROR: ${text}` : text });
      }
    }
  } catch (err) {
    thinking.remove();
    const a = document.createElement('div');
    a.className = 'notice err';
    a.textContent = `The assistant stopped: ${err.message}`;
    chatAppend(a);
  } finally {
    agentBusy = false;
    $('#send').removeAttribute('aria-busy');
  }
}

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#ask').value.trim();
  if (!q) return;
  $('#ask').value = '';
  runAgent(q);
});
$('#chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) runAgent(chip.textContent.trim());
});

// ---------- boot ----------
(async function boot() {
  const params = new URLSearchParams(location.search);
  if (params.get('notice') === 'cancelled') notice('warn', 'Checkout cancelled in PayPal. Nothing was charged.');
  try {
    const [data, tools] = await Promise.all([api(`/api/shops/${encodeURIComponent(slug)}`), api(`/api/shops/${encodeURIComponent(slug)}/tools`)]);
    shop = data.shop;
    products = data.products;
    toolDefs = tools.tools;
    document.title = `${shop.name} · Stallfront`;
    $('#shop-name').textContent = shop.name;
    $('#shop-tagline').textContent = shop.tagline || '';
    $('#dash-link').href = `/s/${encodeURIComponent(slug)}/dashboard`;
    renderProducts();
    await registerWebMcpTools();
    if (location.hash) document.getElementById(location.hash.slice(1))?.classList.add('highlight');
  } catch (err) {
    $('#shop-name').textContent = 'Shop not found';
    $('#grid').removeAttribute('aria-busy');
    notice('err', esc(err.message));
  }
})();
