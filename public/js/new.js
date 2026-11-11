// Seller onboarding: photos -> Claude-drafted listings -> publish (PayPal catalog products) -> live shop.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SAMPLES = ['/img/samples/mug.jpg', '/img/samples/tea-tin.jpg', '/img/samples/candle.jpg', '/img/samples/tea-towel.jpg'];
const MAX = 6;

let photos = []; // { dataUrl }
let drafts = []; // listings from Claude

function notice(kind, html) {
  $('#notice').innerHTML = html ? `<p class="notice ${kind}">${html}</p>` : '';
}

function show(step) {
  for (const id of ['step-photos', 'step-review', 'step-live']) $(`#${id}`).hidden = id !== step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Resize in the browser so uploads stay small (longest side 1280 px, JPEG).
function resize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

async function addFiles(files) {
  notice('', '');
  for (const f of [...files]) {
    if (photos.length >= MAX) { notice('warn', `Six photos at most; the rest were skipped.`); break; }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { notice('warn', `${esc(f.name)} is not a JPEG, PNG or WebP image.`); continue; }
    const url = URL.createObjectURL(f);
    try { photos.push({ dataUrl: await resize(url) }); } catch (e) { notice('err', esc(e.message)); }
    URL.revokeObjectURL(url);
  }
  renderThumbs();
}

function renderThumbs() {
  $('#thumbs').innerHTML = photos
    .map((p, i) => `<div class="thumb"><img src="${p.dataUrl}" alt="Photo ${i + 1}"><span class="n">${i + 1}</span><button type="button" data-remove="${i}" aria-label="Remove photo ${i + 1}">×</button></div>`)
    .join('');
  $('#draft').disabled = !photos.length;
}

$('#thumbs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  photos.splice(Number(b.dataset.remove), 1);
  renderThumbs();
});

const drop = $('#drop');
drop.addEventListener('click', () => $('#files').click());
drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#files').click(); } });
$('#files').addEventListener('change', (e) => addFiles(e.target.files));
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); });

$('#use-samples').addEventListener('click', async () => {
  photos = [];
  for (const src of SAMPLES) photos.push({ dataUrl: await resize(src) });
  if (!$('#shop-name').value) $('#shop-name').value = 'Juniper Studio';
  if (!$('#shop-tagline').value) $('#shop-tagline').value = 'Handmade homeware and tea from a small studio';
  renderThumbs();
});

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

$('#draft').addEventListener('click', async () => {
  if (!$('#shop-name').value.trim()) { notice('warn', 'Give your shop a name first.'); $('#shop-name').focus(); return; }
  const btn = $('#draft');
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  $('#draft-status').innerHTML = `<span class="progress"><span class="spinner"></span>Claude is looking at ${photos.length} photo${photos.length > 1 ? 's' : ''}…</span>`;
  try {
    const out = await post('/api/listings/draft', { photos: photos.map((p) => p.dataUrl), hint: $('#hint').value.trim() });
    drafts = out.listings;
    renderListings();
    $('#draft-status').textContent = '';
    notice('ok', `Drafted ${drafts.length} listing${drafts.length > 1 ? 's' : ''} in ${(out.ms / 1000).toFixed(1)} s with ${esc(out.model)}.`);
    show('step-review');
  } catch (err) {
    $('#draft-status').textContent = '';
    notice('err', `Drafting failed: ${esc(err.message)}`);
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = !photos.length;
  }
});

function renderListings() {
  $('#listings').innerHTML = drafts
    .map(
      (l, i) => `
    <article class="listing" data-i="${i}">
      <img src="${esc(l.imageUrl)}" alt="">
      <div class="fields">
        <label class="wide">Title <input name="title" value="${esc(l.title)}" maxlength="80"></label>
        <label class="wide">Card line <input name="summary" value="${esc(l.summary)}" maxlength="160"></label>
        <label class="wide">Description <textarea name="description" maxlength="800">${esc(l.description)}</textarea></label>
        <label>Category <input name="category" value="${esc(l.category)}" maxlength="30"></label>
        <label>Price (USD) <input name="priceUsd" type="number" min="1" max="1000" step="0.5" value="${esc(l.price_usd)}"><span class="why">${esc(l.price_reasoning)}</span></label>
        <label>In stock <input name="stock" type="number" min="0" max="999" value="5"></label>
        <div class="tagline-row">${(l.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${(l.gift_for || []).map((t) => `<span class="tag">gift: ${esc(t)}</span>`).join('')}</div>
        ${l.needs_seller_check?.length ? `<div class="checks"><strong>Check before publishing:</strong> ${l.needs_seller_check.map(esc).join('; ')}</div>` : ''}
      </div>
    </article>`,
    )
    .join('');
}

$('#back').addEventListener('click', () => show('step-photos'));

$('#publish').addEventListener('click', async () => {
  const btn = $('#publish');
  const products = [...document.querySelectorAll('.listing')].map((el) => {
    const l = drafts[Number(el.dataset.i)];
    const v = (n) => el.querySelector(`[name="${n}"]`).value.trim();
    return {
      title: v('title'), summary: v('summary'), description: v('description'), category: v('category'),
      priceUsd: Number(v('priceUsd')), stock: Number(v('stock')),
      attributes: l.attributes, tags: l.tags, giftFor: l.gift_for, imageUrl: l.imageUrl,
    };
  });
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  $('#publish-status').innerHTML = '<span class="progress"><span class="spinner"></span>Registering products with PayPal…</span>';
  try {
    const out = await post('/api/shops', {
      name: $('#shop-name').value.trim(), tagline: $('#shop-tagline').value.trim(),
      shippingUsd: Number($('#shipping').value), products,
    });
    const registered = out.products.filter((p) => p.paypalProductId).length;
    $('#live-facts').innerHTML = `
      <dt>Shop</dt><dd><a href="${esc(out.shopUrl)}">${esc(location.origin + out.shopUrl)}</a></dd>
      <dt>PayPal catalog</dt><dd>${registered} of ${out.products.length} products registered${registered ? ` (${out.products.filter((p) => p.paypalProductId).map((p) => `<span class="mono">${esc(p.paypalProductId)}</span>`).join(', ')})` : ''}</dd>
      <dt>Agent tools</dt><dd>WebMCP on the shop page, and MCP at <span class="mono">${esc(out.mcpUrl)}</span></dd>`;
    if (out.warnings?.length) notice('warn', `Some products were not registered with PayPal: ${out.warnings.map(esc).join('; ')}`);
    else notice('', '');
    $('#open-shop').href = out.shopUrl;
    $('#open-dash').href = out.dashboardUrl;
    show('step-live');
  } catch (err) {
    notice('err', `Publishing failed: ${esc(err.message)}`);
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    $('#publish-status').textContent = '';
  }
});
