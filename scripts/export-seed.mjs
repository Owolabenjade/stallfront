// Exports one shop from the runtime store (data/store.json) into data/seed.json as the public demo shop.
// Usage: node scripts/export-seed.mjs <slug> [imageUrl ...]   (image URLs replace product images in order)
import fs from 'node:fs';

const [slug, ...images] = process.argv.slice(2);
const store = JSON.parse(fs.readFileSync('data/store.json', 'utf8'));
const shop = store.shops.find((s) => s.slug === slug);
if (!shop) throw new Error(`No shop ${slug} in data/store.json`);
const products = store.products
  .filter((p) => p.shopSlug === slug)
  .map((p, i) => ({ ...p, imageUrl: images[i] || p.imageUrl }));
const seed = { shops: [{ ...shop, demo: true }], products, orders: [], activity: [] };
fs.writeFileSync('data/seed.json', JSON.stringify(seed, null, 2));
for (const p of products) console.log(`${p.id}  ${p.title}  $${p.priceCents / 100}  ${p.imageUrl}  ${p.paypalProductId}`);
