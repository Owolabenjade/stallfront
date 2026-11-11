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
| I-008 | MCP endpoint `/mcp/<slug>` with the same tools | claude | todo | M2 | A real MCP client lists the tools and creates a checkout | E-005 (list and search only) |
| I-009 | Seller dashboard with channel attribution, agent trace and PayPal IDs; capture webhook | claude | todo | M2 | Captured agent order appears with channel, trace and capture ID | |
| I-010 | States and design floor on the demo path | claude | todo | M3 | Loading, empty and error states; design floor checklist passes | |
| I-011 | README, video script, submission text | claude | todo | M4 | presubmit passes; video uploaded; form drafted | |
| I-012 | Record and upload the video; submit on Devpost | human | todo | M4 | YouTube link public; Devpost shows submitted | |
| I-013 | Human checkout with PayPal JS SDK v6 buttons on the shop page | claude | parked | | | |
| I-014 | Shipment tracking from the seller dashboard | claude | parked | | | |
| I-015 | Trace shows product names instead of raw product IDs in create_checkout args | claude | todo | M3 | Trace reads "bag, phone stand" | |
| I-016 | Measure agent reliability over repeated runs of the demo prompt | claude | todo | M3 | 10 runs recorded with pass rate | |

## Notes
Add a `### I-00N` section only when an issue needs more than its row.
