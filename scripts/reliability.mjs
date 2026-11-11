// Runs the buyer-assistant check N times and reports a pass rate.
// A run passes when the handoff card shows the expected items and total.
// Usage: node scripts/reliability.mjs [baseUrl] [--runs 10] [--gap 20] [--prompt "..."] [--expect "Bag,Stand,Total $33.50"]
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const at = (flag, dflt) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : dflt);
const BASE = args.find((a) => a.startsWith('http')) || 'http://localhost:3000';
const RUNS = Number(at('--runs', 10));
const GAP_S = Number(at('--gap', 20)); // spacing between runs, to stay inside the free Groq plan's per-minute limits
const PROMPT = at('--prompt', null);
const EXPECT = at('--expect', 'Bag,Stand,Total $33.50').split(',').map((s) => s.trim());

const rows = [];
for (let i = 1; i <= RUNS; i++) {
  const t0 = Date.now();
  const out = spawnSync(process.execPath, ['scripts/agent-check.mjs', BASE, ...(PROMPT ? ['--prompt', PROMPT] : [])], { encoding: 'utf8', timeout: 240000 });
  const text = `${out.stdout || ''}${out.stderr || ''}`;
  const line = (prefix) => text.split('\n').find((l) => l.startsWith(prefix)) || '';
  const handoff = line('handoff:');
  const calls = line('tool calls via WebMCP').replace(/^tool calls via WebMCP \(\d+\): /, '');
  const replies = text.split('\n').filter((l) => l.startsWith('assistant:'));
  const pass = out.status === 0 && EXPECT.every((e) => handoff.includes(e));
  const row = {
    run: i,
    pass,
    toolCalls: (calls.match(/->/g) || []).length + (calls ? 1 : 0),
    handoffS: (line('time to handoff:').match(/([\d.]+) s;/) || [])[1] || '-',
    models: line('model turns').replace(/^model turns \(\d+\): /, ''),
    linkInReply: replies.some((r) => r.includes('paypal.com')),
    error: pass ? '' : (handoff || (line('ERROR:') !== 'ERROR: null' && line('ERROR:')) || line('FAIL') || `no checkout; reply: ${replies.join(' ')}`).slice(0, 200),
    calls,
  };
  rows.push(row);
  console.log(`run ${i}: ${pass ? 'PASS' : 'FAIL'} | ${row.toolCalls} calls | handoff ${row.handoffS} s | models ${row.models} | ${row.calls}${row.error ? ` | ${row.error}` : ''}`);
  const wait = GAP_S * 1000 - (Date.now() - t0);
  if (i < RUNS && wait > 0) await new Promise((r) => setTimeout(r, wait));
}
const passed = rows.filter((r) => r.pass).length;
const times = rows.filter((r) => r.pass).map((r) => Number(r.handoffS)).sort((a, b) => a - b);
console.log(`\n${passed}/${RUNS} passed (expect: ${EXPECT.join(' + ')})`);
if (times.length) console.log(`handoff time on passing runs: median ${times[Math.floor(times.length / 2)]} s, max ${times[times.length - 1]} s`);
console.log(`runs where the reply pasted the PayPal link: ${rows.filter((r) => r.linkInReply).length}`);
process.exit(passed === RUNS ? 0 : 1);
