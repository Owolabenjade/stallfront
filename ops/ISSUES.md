# ISSUES

Status: todo | doing | blocked | done | parked | cut
`done` requires an evidence ID. One `doing` item per owner. New ideas enter as `parked` and wait for a DECISION or a free slot.
If the team also uses GitHub Issues, put the GitHub number in the Title cell and keep this table as the index.

| ID | Title | Owner | Status | Milestone | Done when | Evidence |
|---|---|---|---|---|---|---|
| I-001 | Verify critical dependencies | claude | done | M1 | Every critical row in DEPENDENCIES is verified with evidence | E-003, E-005, E-006, E-008, E-009, E-011, E-013 |
| I-002 | PayPal developer account and sandbox REST app | human | done | M1 | Client ID and secret in local `.env`; sandbox business and personal accounts listed | E-008 |
| I-003 | Public GitHub repo and Render service | human | done | M1 | Repo public with MIT license; Render service deploys `main` | E-013 |
| I-004 | Tracer bullet: seeded product, `create_checkout` tool, sandbox order approved and captured, on Render | claude | done | M1 | Order captured in sandbox from the public URL; smoke check passes | E-013 |
| I-005 | Smoke check script for the demo path | claude | done | M1 | `npm run smoke` exits 0 locally and against Render | E-012, E-013 |
| I-006 | Photos to listings with the vision model; publish creates PayPal Catalog products | claude | done | M2 | Four sample photos become four listings and four PayPal product IDs | E-011 |
| I-007 | In-page buyer agent: model tool loop over the page's WebMCP tools, with visible trace | claude | done | M2 | A shopping request ends with a PayPal approval link | E-010, E-012 |
| I-008 | MCP endpoint `/mcp/<slug>` with the same tools | claude | done | M2 | A real MCP client lists the tools and creates a checkout | E-005, E-013, E-014 |
| I-009 | Seller dashboard with channel attribution, agent trace and PayPal IDs | claude | done | M2 | Captured agent order appears with channel, trace and capture ID | E-013 (API, public), E-014 (page) |
| I-010 | States and design floor on the demo path | claude | done | M3 | Loading, empty and error states; design floor checklist passes | E-019 (redesign D-006: empty, loading, busy and error copy on every page; 1366 and 390 px screenshots) |
| I-011 | README, video script, submission text | claude | done | M4 | presubmit passes; video uploaded; form drafted | E-024, E-025, presubmit 0 errors at 2026-11-11T18:22Z |
| I-012 | Video produced (E-024); human uploads it to YouTube and submits on Devpost | human | doing | M4 | YouTube link public; Devpost shows submitted | E-024 (video file) |
| I-013 | Human checkout with PayPal JS SDK v6 buttons on the shop page | claude | parked | | | |
| I-014 | Shipment tracking from the seller dashboard | claude | parked | | | |
| I-015 | Trace shows product names instead of raw product IDs in create_checkout args | claude | done | M3 | Trace reads "bag, phone stand" | E-015, E-017 |
| I-016 | Measure agent reliability over repeated runs of the demo prompt | claude | done | M3 | 10 runs recorded with pass rate | E-015 |
| I-017 | PayPal capture webhook with signature verification (return URL already captures) | claude | parked | | | |
| I-018 | Seller view: price wraps under long titles; clearer summary line | claude | done | M3 | Price stays on the title row at 1366 px; summary reads "3 orders, all from AI agents; 1 paid" | E-017 |
| I-019 | English-language sandbox buyer for the video (current one shows PayPal in Arabic) | human | cut | M4 | New sandbox personal account, US, English; README updated | Human keeps the current buyer and uses Google Translate while recording |
| I-020 | Redesign (bold magazine) and plain-English copy on every page | claude | done | M3 | No code words in user-facing copy; screenshots at 1366 and 390 px | E-019, D-006 |
| I-021 | Rebuild the demo shop from the human's six new photos | claude | done | M3 | New seed through the real pipeline; demo prompts pass on Render | E-019, D-007 |
| I-022 | Seller-first headline everywhere: site hero and page title, README title and intro, cover image, video title card and narration, package.json description, GitHub About | claude (human approved the line) | done | M4 | New headline live on Render, always followed by the AI-assistant line (E-021); cover retaken; ops/DEMO.md and README updated; presubmit clean | E-022 |
| I-023 | Seller view: an opened "What the assistant did" list closed on every 4 s refresh | claude | done | M4 | List stays open across refreshes | E-024 |
| I-024 | Shop tools promised "ships in 2 to 4 days" that no seller set; an outside agent repeated it | claude | done | M4 | Shipping states only what the seller set | E-027, E-028 |

## Notes
Add a `### I-00N` section only when an issue needs more than its row.
