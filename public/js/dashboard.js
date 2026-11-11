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
  webmcp: { label: 'AI agent · WebMCP', cls: 'agent', icon: ICON_BOT },
  mcp: { label: 'AI agent · MCP', cls: 'agent', icon: ICON_BOT },
  web: { label: 'Shopper · website', cls: '', icon: ICON_USER },
};
const STATUS = { paid: ['paid', 'Paid'], awaiting_buyer: ['waiting', 'Waiting for buyer approval in PayPal'], cancelled: ['cancelled', 'Cancelled'], capture_pending: ['waiting', 'Capture pending'] };

let seenPaid = null;

function renderOrders(orders) {
  if (!orders.length) {
    $('#orders').innerHTML = `<div class="empty">No orders yet. Open the shop and ask its assistant for a gift, or connect an MCP client to the address on the right.</div>`;
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
          ${o.agent && o.channel !== 'web' ? `<span>${esc(o.agent)}</span>` : ''}
          <span class="st ${st[0]}">${esc(st[1])}</span>
          <span>${when(o.createdAt)}</span>
        </div>
        <div class="order-meta ids">PayPal order ${esc(o.paypalOrderId)}${o.captureId ? ` · capture ${esc(o.captureId)}` : ''}</div>
        ${o.note ? `<p class="note">Note from the buyer's agent: "${esc(o.note)}"</p>` : ''}
        ${o.trace?.length ? `<details class="trace"><summary>Agent's ${o.trace.length} tool call${o.trace.length > 1 ? 's' : ''}</summary><ol>${o.trace.map((t) => `<li><code>${esc(t.tool)}</code> ${esc(t.summary)}</li>`).join('')}</ol></details>` : ''}
      </article>`;
    })
    .join('');
  seenPaid = paidNow;
}

function renderActivity(activity) {
  if (!activity.length) return;
  $('#activity').innerHTML = activity
    .map((a) => `<li class="${a.ok ? '' : 'fail'}"><time datetime="${esc(a.at)}">${time(a.at)}</time><span class="t">${esc(a.tool)} <span class="muted">· ${esc(a.channel === 'mcp' ? 'MCP' : a.channel === 'web' ? 'website' : 'WebMCP')}</span></span><span class="s">${esc(a.summary)}</span></li>`)
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
  const byAgent = paid.filter((o) => o.channel !== 'web');
  $('#summary').textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}; ${paid.length} paid (${money(paid.reduce((s, o) => s + o.totalCents, 0))}), ${byAgent.length} of them placed by AI agents.${shop.demo ? ' Demo shop: this view is public.' : ''}`;
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
