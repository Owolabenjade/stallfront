// JSON file store. Runtime state lives in data/store.json; data/seed.json restores the demo shop.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

let db = null;

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function load({ reset = false } = {}) {
  if (db && !reset) return db;
  db = !reset && fs.existsSync(STORE_FILE) ? read(STORE_FILE) : read(SEED_FILE);
  db.shops ??= [];
  db.products ??= [];
  db.orders ??= [];
  db.activity ??= [];
  if (reset) save();
  return db;
}

export function save() {
  const tmp = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;

export function getShop(slug) {
  return load().shops.find((s) => s.slug === slug) || null;
}

export function shopProducts(slug) {
  return load().products.filter((p) => p.shopSlug === slug && p.status !== 'draft');
}

export function getProduct(slug, id) {
  return load().products.find((p) => p.shopSlug === slug && p.id === id) || null;
}

export function getOrder(id) {
  return load().orders.find((o) => o.id === id) || null;
}

export function shopOrders(slug) {
  return load().orders.filter((o) => o.shopSlug === slug).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addOrder(order) {
  load().orders.push(order);
  save();
  return order;
}

export function updateOrder(id, patch) {
  const order = getOrder(id);
  if (!order) return null;
  Object.assign(order, patch);
  save();
  return order;
}

/** Tool-call log. Each entry: { at, shopSlug, sessionId, channel, tool, args, ok, summary }. */
export function logActivity(entry) {
  const list = load().activity;
  list.push({ at: new Date().toISOString(), ...entry });
  if (list.length > 2000) list.splice(0, list.length - 2000);
  save();
}

export function sessionTrace(shopSlug, sessionId) {
  if (!sessionId) return [];
  return load().activity.filter((a) => a.shopSlug === shopSlug && a.sessionId === sessionId);
}
