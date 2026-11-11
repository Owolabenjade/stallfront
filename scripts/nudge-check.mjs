// Checks the guard for replies that announce an action without calling a tool (seen in E-015):
// 1) the detector on known texts, 2) that the model, given the reminder, calls create_checkout.
// Usage: node --env-file=.env scripts/nudge-check.mjs [baseUrl]   (needs GROQ_API_KEY and a running server for the search result)
import { announcesWithoutActing, completeTurn, agentSystem } from '../server/ai.js';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
let failed = 0;
const check = (ok, label) => {
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
};

const seen = 'I’ve found a white ceramic mug with a red leaf design and blue rim that’s perfect for a coffee lover, priced at $12. I’ll create a checkout for one mug (shipping $6 extra).';
check(announcesWithoutActing({ content: seen }) === true, 'detector flags the reply seen in E-015');
check(announcesWithoutActing({ content: seen, tool_calls: [{}] }) === false, 'detector ignores a reply that carries a tool call');
check(announcesWithoutActing({ content: 'The total is $18. Press "Review and pay in PayPal" to approve it.' }) === false, 'detector ignores a normal closing reply');
check(announcesWithoutActing({ content: 'Sorry, we don’t have any laptop chargers in the store.' }) === false, 'detector ignores a "nothing fits" reply');

const { shop } = await (await fetch(`${BASE}/api/shops/corner-stall`)).json();
const args = { query: 'coffee lover gift', max_price_usd: 20 };
const search = await (await fetch(`${BASE}/api/shops/corner-stall/tools/search_products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-stallfront-session': 'nudge-check' }, body: JSON.stringify(args) })).json();
const base = [
  { role: 'system', content: agentSystem(shop) },
  { role: 'user', content: 'A gift under $20 for a coffee lover' },
  { role: 'assistant', content: '', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'search_products', arguments: JSON.stringify(args) } }] },
  { role: 'tool', tool_call_id: 'call_1', content: search.content[0].text },
  { role: 'assistant', content: seen },
  { role: 'system', content: 'Reminder from the shop page: your last reply said you would do something but called no tool. Call the tool now, in this turn.' },
];
for (let i = 1; i <= 3; i++) {
  const turn = await completeTurn(base);
  const names = (turn.message.tool_calls || []).map((c) => c.function.name);
  check(names.includes('create_checkout'), `with the reminder, run ${i}: model ${turn.model} calls ${names.join(', ') || 'no tool'}`);
}
console.log(failed ? `\n${failed} check(s) failed` : '\nNudge check passed');
process.exit(failed ? 1 : 0);
