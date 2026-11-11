// Builds a shop through the real pipeline: each photo -> /api/listings/draft (vision model), then /api/shops
// (registers products in the PayPal catalog). Prints the drafts and the publish result as JSON.
// Usage: node scripts/build-demo-shop.mjs <baseUrl> <outJson> <name> <tagline> <photo...>
import fs from 'node:fs';

const [base, out, name, tagline, ...photos] = process.argv.slice(2);
if (!photos.length) throw new Error('usage: build-demo-shop.mjs <baseUrl> <outJson> <name> <tagline> <photo...>');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const drafts = [];
let draftId;
for (let i = 0; i < photos.length; i++) {
  const mime = photos[i].endsWith('.png') ? 'image/png' : 'image/jpeg';
  const photo = `data:${mime};base64,${fs.readFileSync(photos[i]).toString('base64')}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const t0 = Date.now();
    const res = await fetch(`${base}/api/listings/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo, index: i + 1, draftId }) });
    const json = await res.json();
    if (res.ok) {
      draftId = json.draftId;
      drafts.push({ source: photos[i], ms: Date.now() - t0, model: json.model, ...json.listing });
      console.log(`photo ${i + 1}: "${json.listing.title}" $${json.listing.price_usd} (${Date.now() - t0} ms, ${json.mode})`);
      break;
    }
    if (res.status !== 429) throw new Error(`photo ${i + 1}: ${res.status} ${json.error}`);
    const wait = Number(res.headers.get('retry-after')) || 15;
    console.log(`photo ${i + 1}: rate limited, waiting ${wait} s`);
    await sleep(wait * 1000);
  }
}
fs.writeFileSync(out, JSON.stringify({ drafts }, null, 2));
console.log(`drafts written to ${out}`);
