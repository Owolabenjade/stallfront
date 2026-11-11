// Seller view: orders with the channel that placed them, the agent's tool trace and PayPal IDs.
const slug = decodeURIComponent(location.pathname.split('/')[2] || '');
const key = new URLSearchParams(location.search).get('key') || '';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (c) => `$${(c / 100).toFixed(2)}`;
const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const when = (iso) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const ICON_BOT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
const CHANNEL = {
  webmcp: { label: 'AI assistant · on your shop page', tech: 'WebMCP', cls: 'agent', icon: ICON_BOT },
  mcp: { label: 'AI app · connected to your shop', tech: 'MCP', cls: 'agent', icon: ICON_BOT },
  web: { label: 'Shopper · on your website', tech: '', cls: '', icon: ICON_USER },
};
const STATUS = { paid: ['paid', 'Paid'], awaiting_buyer: ['waiting', 'Waiting for the buyer to pay in PayPal'], cancelled: ['cancelled', 'Cancelled'], capture_pending: ['waiting', 'Payment processing'] };
const STEP = { search_products: 'Searched the shop', get_product: 'Looked closer', create_checkout: 'Got a PayPal checkout ready', get_order_status: 'Checked the order' };
const agentName = (a) => (a === 'in-page or browser agent' ? 'Shop page assistant' : a);

let seenPaid = null;
let lastOrders = null;

function renderOrders(orders) {
  // The page refreshes every few seconds. Redraw only when an order changed, and keep any
  // "What the assistant did" list the seller opened open across the redraw.
  const sig = JSON.stringify(orders.map((o) => [o.id, o.status, o.captureId || '', o.trace?.length || 0]));
  if (sig === lastOrders) return;
  lastOrders = sig;
  const open = new Set([...document.querySelectorAll('#orders details.trace[open]')].map((d) => d.dataset.order));
  if (!orders.length) {
    $('#orders').innerHTML = `<div class="empty">No orders yet. Open your shop and ask its assistant for something, or connect an AI app to the address on the right.</div>`;
    return;
  }
  const paidNow = new Set(orders.filter((o) => o.status === 'paid').map((o) => o.id));
  $('#orders').innerHTML = orders
    .map((o) => {
      const ch = CHANNEL[o.channel] || { label: o.channel, cls: '', icon: '' };
      const st = STATUS[o.status] || ['waiting', o.status];
      const fresh = seenPaid && paidNow.has(o.id) && !seenPaid.has(o.id);
      return `
      <article class="order${fresh ? ' fresh arrive' : ''}">
        <div class="order-top">
          <span class="what">${o.items.map((i) => `${esc(i.quantity)} × ${esc(i.title)}`).join(', ')}</span>
          <span class="amt">${money(o.totalCents)}</span>
        </div>
        <div class="order-meta">
          <span class="channel ${ch.cls}">${ch.icon}${esc(ch.label)}</span>
          ${o.agent && o.channel !== 'web' ? `<span class="agent-name">${esc(agentName(o.agent))}</span>` : ''}
          <span class="st ${st[0]}">${esc(st[1])}</span>
          <span>${when(o.createdAt)}</span>
        </div>
        <div class="order-meta ids">PayPal order ${esc(o.paypalOrderId)}${o.captureId ? ` · payment ${esc(o.captureId)}` : ''}${ch.tech ? ` · ${ch.tech}` : ''}</div>
        ${o.note ? `<p class="note">The assistant's note: "${esc(o.note)}"</p>` : ''}
        ${o.trace?.length && o.channel !== 'web' ? `<details class="trace" data-order="${esc(o.id)}"${open.has(o.id) ? ' open' : ''}><summary>What the assistant did (${o.trace.length} step${o.trace.length > 1 ? 's' : ''})</summary><ol>${o.trace.map((t) => `<li><span><span class="v">${esc(STEP[t.tool] || t.tool)}.</span> ${esc(t.summary)}</span><span class="tech">${esc(t.tool)}</span></li>`).join('')}</ol></details>` : ''}
      </article>`;
    })
    .join('');
  seenPaid = paidNow;
}

function renderActivity(activity) {
  // The panel is "What assistants did": a shopper's own Buy with PayPal click is not an assistant step.
  const byAssistants = activity.filter((a) => a.channel !== 'web');
  if (!byAssistants.length) return;
  $('#activity').innerHTML = byAssistants
    .map((a) => `<li class="${a.ok ? '' : 'fail'}"><time datetime="${esc(a.at)}">${time(a.at)}</time><span class="t">${esc(STEP[a.tool] || a.tool)}</span><span class="s">${esc(a.summary)}</span><span class="tech">${esc(a.tool)} · ${esc(a.channel === 'mcp' ? 'MCP' : a.channel === 'web' ? 'website' : 'WebMCP')}</span></li>`)
    .join('');
}

async function load() {
  const res = await fetch(`/api/shops/${encodeURIComponent(slug)}/dashboard${key ? `?key=${encodeURIComponent(key)}` : ''}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    $('#shop-name').textContent = 'Seller view unavailable';
    $('#notice').innerHTML = `<p class="notice err">${esc(json.error || 'Could not load this shop.')}</p>`;
    return false;
  }
  const { shop, orders, activity } = json;
  document.title = `${shop.name} · Seller view`;
  $('#shop-name').textContent = shop.name;
  const paid = orders.filter((o) => o.status === 'paid');
  const byAgent = orders.filter((o) => o.channel !== 'web').length;
  $('#stats').innerHTML = `
    <div><dt>Orders</dt><dd>${orders.length}</dd></div>
    <div><dt>Paid</dt><dd class="accent">${money(paid.reduce((s, o) => s + o.totalCents, 0)).replace('.00', '')}</dd></div>
    <div><dt>From AI assistants</dt><dd>${byAgent}</dd></div>`;
  $('#summary').textContent = shop.demo ? 'This is the demo shop, so anyone can see this page. Your own shop gets a private link.' : 'Keep this page’s link to yourself.';
  renderOrders(orders);
  renderActivity(activity);
  return true;
}

(async () => {
  $('#shop-link').href = `/s/${encodeURIComponent(slug)}`;
  const mcp = `${location.origin}/mcp/${slug}`;
  $('#mcp-url').textContent = mcp;
  $('#claude-cmd').textContent = `claude mcp add --transport http ${slug} ${mcp}`;
  $('#copy-mcp').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(mcp); $('#copy-mcp').textContent = 'Copied'; } catch { $('#copy-mcp').textContent = 'Copy failed'; }
    setTimeout(() => ($('#copy-mcp').textContent = 'Copy'), 1500);
  });
  if (await load()) setInterval(load, 4000);
})();
