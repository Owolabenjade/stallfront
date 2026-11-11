# CLOCK

Kickoff: 2026-10-01T09:15:00-07:00
Deadline: 2026-11-12T12:00:00-08:00
Timezone of record: Africa/Lagos
Timebox: hackathon

Times are ISO 8601 with an offset, for example 2026-11-15T23:59:00-08:00. The deadline is the organizer's, copied from the event page with its timezone; the Submitted gate is ours and comes earlier.
Agents do not know the time. Read it from the system (`date -u`) at every boot.

Deadline in other zones: 2026-11-12T20:00Z = 2026-11-12T21:00+01:00 (builder's local clock, W. Central Africa). US DST ended 2026-11-01, so PT is UTC-8 (DERIVED).
Work started 2026-11-11T05:14Z with about 38.75 h left; about 30 working hours after sleep and breaks (INFERRED). Gates below are set from that start, not from the event kickoff.

## Gates
| Gate | At | Exit condition |
|---|---|---|
| Research done | 2026-11-11T06:30+01:00 | Idea picked, critical dependencies verified |
| Tracer bullet | 2026-11-11T13:00+01:00 | Demo path runs end to end on a public URL |
| Feature freeze | 2026-11-12T02:00+01:00 | No new features after this; fixes, states, polish and docs only |
| Video recorded | 2026-11-12T15:30+01:00 | Final cut uploaded and plays logged out |
| Submitted | 2026-11-12T18:00+01:00 | Platform shows submitted; evidence recorded |

## Unavailable blocks
Sleep, travel, classes, work. Plan the gates around these.
- 2026-11-12T02:00+01:00 to 2026-11-12T08:00+01:00: sleep (assumed; the human adjusts)

## Session log
| Start (UTC) | End (UTC) | Who | Did | Next |
|---|---|---|---|---|
| 2026-11-10T23:05Z | 2026-11-11T05:20Z | claude + human | Research, Gate A (agent-ready shop), Gate B (Stallfront), foundation init | PayPal sandbox app (human), tracer bullet (claude) |
| 2026-11-11T05:20Z | 2026-11-11T11:10Z | claude + human | PayPal keys, Groq switch (D-005), photos to catalog, buyer assistant, Render deploy; tracer gate met at 11:07Z (E-013) | MCP create_checkout (I-008), reliability runs (I-016), README |
| 2026-11-11T11:15Z | 2026-11-11T11:57Z | claude | MCP checkout, trace names, seller view fixes, agent prompt fixes and reliability (E-014 to E-017), unit tests, README, DEMO, SUBMISSION, cover; presubmit 0 errors | English sandbox buyer (human), video prep, design floor (I-010) |
