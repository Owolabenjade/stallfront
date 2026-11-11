// Unit tests for the parts of server/ai.js that do not call the model.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { announcesWithoutActing, normalize } from '../server/ai.js';

test('flags a reply that promises a checkout but calls no tool (seen on Render, E-015)', () => {
  const seen = 'I’ve found a white ceramic mug … priced at $12. I’ll create a checkout for one mug (shipping $6 extra).';
  assert.equal(announcesWithoutActing({ content: seen }), true);
  assert.equal(announcesWithoutActing({ content: 'Let me search the shop for that.' }), true);
});

test('leaves normal replies and replies with tool calls alone', () => {
  assert.equal(announcesWithoutActing({ content: 'The total is $18. Press "Review and pay in PayPal" to approve it.' }), false);
  assert.equal(announcesWithoutActing({ content: 'Sorry, we don’t have any laptop chargers in the store.' }), false);
  assert.equal(announcesWithoutActing({ content: 'I’ll create a checkout now.', tool_calls: [{ id: 'x' }] }), false);
});

test('normalize maps free-text categories onto the fixed list', () => {
  assert.equal(normalize({ category: 'drinkware' }).category, 'kitchen');
  assert.equal(normalize({ category: 'Bags & luggage' }).category, 'bags');
  assert.equal(normalize({ category: 'spaceships' }).category, 'other');
});

test('normalize rounds prices to 50 cents and clamps them', () => {
  assert.equal(normalize({ price_usd: 12.3 }).price_usd, 12.5);
  assert.equal(normalize({ price_usd: 5000 }).price_usd, 1000);
  assert.equal(normalize({ price_usd: 0.2 }).price_usd, 1);
});

test('normalize caps tags, gift notes and seller checks', () => {
  const l = normalize({ tags: Array.from({ length: 20 }, (_, i) => `t${i}`), gift_for: ['a', 'b', 'c', 'd', 'e'], needs_seller_check: ['1', '2', '3', '4', '5'] });
  assert.equal(l.tags.length, 8);
  assert.equal(l.gift_for.length, 4);
  assert.equal(l.needs_seller_check.length, 4);
});
