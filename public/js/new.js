// Seller onboarding: photos -> AI-drafted listings -> publish (PayPal catalog products) -> live shop.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SAMPLES = ['/img/samples/leather-handbag.jpg', '/img/samples/slogan-mugs.jpg', '/img/samples/leather-loafers.jpg', '/img/samples/denim-jacket.jpg'];
const MAX = 6;

let photos = []; // { dataUrl }
let drafts = []; // listings drafted by the vision model

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
  if (!$('#shop-name').value) $('#shop-name').value = 'Corner Stall';
  if (!$('#shop-tagline').value) $('#shop-tagline').value = 'Leather bags, shoes, mugs and denim from a small market stall';
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
  const status = (text) => ($('#draft-status').innerHTML = `<span class="progress"><span class="spinner"></span>${esc(text)}</span>`);
  try {
    const t0 = performance.now();
    let draftId;
    let model;
    drafts = [];
    for (let i = 0; i < photos.length; i++) {
      for (let attempt = 0; ; attempt++) {
        status(`Writing listing ${i + 1} of ${photos.length}`);
        const res = await fetch('/api/listings/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: photos[i].dataUrl, index: i + 1, draftId, hint: $('#hint').value.trim() }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          draftId = json.draftId;
          model = json.model;
          drafts.push(json.listing);
          break;
        }
        // The free AI plan limits tokens per minute: wait as the server says, then retry (up to 4 times).
        if (res.status === 429 && attempt < 4) {
          const wait = Math.min(Number(res.headers.get('retry-after')) || 15, 60);
          for (let s = wait; s > 0; s--) {
            status(`Short pause (the free AI plan has a speed limit). Listing ${i + 1} starts in ${s} s`);
            await new Promise((r) => setTimeout(r, 1000));
          }
          continue;
        }
        throw new Error(`Photo ${i + 1}: ${json.error || `the request failed (${res.status})`}`);
      }
    }
    renderListings();
    $('#draft-status').textContent = '';
    notice('ok', `Your ${drafts.length === 1 ? 'listing is' : `${drafts.length} listings are`} ready to check.`);
    show('step-review');
  } catch (err) {
    $('#draft-status').textContent = '';
    notice('err', `We couldn't write the listings. ${esc(err.message)} Try again in a minute.`);
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
      <div class="pic"><img src="${esc(l.imageUrl)}" alt=""><span class="n">${String(i + 1).padStart(2, '0')}</span></div>
      <div class="fields">
        <label class="wide">Title <input name="title" value="${esc(l.title)}" maxlength="80"></label>
        <label class="wide">Short description (on the product card) <input name="summary" value="${esc(l.summary)}" maxlength="160"></label>
        <label class="wide">Full description <textarea name="description" maxlength="800">${esc(l.description)}</textarea></label>
        <label>Category <input name="category" value="${esc(l.category)}" maxlength="30"></label>
        <label>Price (USD) <input name="priceUsd" type="number" min="1" max="1000" step="0.5" value="${esc(l.price_usd)}"></label>
        <label>How many <input name="stock" type="number" min="0" max="999" value="5"></label>
        ${l.price_reasoning ? `<p class="why wide"><strong>Why this price</strong> ${esc(l.price_reasoning)}</p>` : ''}
        ${l.needs_seller_check?.length ? `<div class="checks"><strong>Check before you publish</strong>${l.needs_seller_check.map(esc).join('; ')}</div>` : ''}
        <div class="tagline-row"><span class="lbl">Shoppers can find it by</span>${(l.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        ${l.gift_for?.length ? `<div class="tagline-row"><span class="lbl">A good gift for</span>${l.gift_for.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
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
  $('#publish-status').innerHTML = '<span class="progress"><span class="spinner"></span>Registering your products with PayPal</span>';
  try {
    const out = await post('/api/shops', {
      name: $('#shop-name').value.trim(), tagline: $('#shop-tagline').value.trim(),
      shippingUsd: Number($('#shipping').value), products,
    });
    const registered = out.products.filter((p) => p.paypalProductId).length;
    const ids = out.products.filter((p) => p.paypalProductId).map((p) => esc(p.paypalProductId)).join(' · ');
    $('#live-facts').innerHTML = `
      <dt>Your shop</dt><dd><a href="${esc(out.shopUrl)}">${esc(location.origin + out.shopUrl)}</a></dd>
      <dt>Registered with PayPal</dt><dd>${registered} of ${out.products.length} products${ids ? `<span class="tech">PayPal product IDs: ${ids}</span>` : ''}</dd>
      <dt>AI shopping assistants</dt><dd>Assistants can shop right on your shop page. Other AI apps can connect at this address:<span class="tech">${esc(out.mcpUrl)} (MCP) · shop page actions via WebMCP</span></dd>`;
    if (out.warnings?.length) notice('warn', `Some products weren't registered with PayPal: ${out.warnings.map(esc).join('; ')}`);
    else notice('', '');
    $('#open-shop').href = out.shopUrl;
    $('#open-dash').href = out.dashboardUrl;
    show('step-live');
  } catch (err) {
    notice('err', `We couldn't publish your shop. ${esc(err.message)}`);
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    $('#publish-status').textContent = '';
  }
});
