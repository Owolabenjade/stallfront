# ISSUES

Status: todo | doing | blocked | done | parked | cut
`done` requires an evidence ID. One `doing` item per owner. New ideas enter as `parked` and wait for a DECISION or a free slot.
If the team also uses GitHub Issues, put the GitHub number in the Title cell and keep this table as the index.

| ID | Title | Owner | Status | Milestone | Done when | Evidence |
|---|---|---|---|---|---|---|
| I-001 | Verify critical dependencies | claude | blocked | M1 | Every critical row in DEPENDENCIES is verified with evidence | |
| I-002 | PayPal developer account and sandbox REST app | human | doing | M1 | Client ID and secret in local `.env`; sandbox business and personal accounts listed | |
| I-003 | Public GitHub repo and Render service | human | todo | M1 | Repo public with MIT license; Render service deploys `main` | |
| I-004 | Tracer bullet: seeded product, `create_checkout` tool, sandbox order approved and captured, on Render | claude | doing | M1 | Order captured in sandbox from the public URL; smoke check passes | |
| I-005 | Smoke check script for the demo path | claude | todo | M1 | `npm run smoke` exits 0 locally and against Render | |
| I-006 | Photos to listings with Claude vision; publish creates PayPal Catalog products | claude | todo | M2 | Four sample photos become four listings and four PayPal product IDs | |
| I-007 | In-page buyer agent: Claude tool loop over the page's WebMCP tools, with visible trace | claude | todo | M2 | "Gift under $40 for a tea lover" ends with a PayPal approval link | |
| I-008 | MCP endpoint `/mcp/<slug>` with the same tools | claude | todo | M2 | A real MCP client lists the tools and creates a checkout | |
| I-009 | Seller dashboard with channel attribution, agent trace and PayPal IDs; capture webhook | claude | todo | M2 | Captured agent order appears with channel, trace and capture ID | |
| I-010 | States and design floor on the demo path | claude | todo | M3 | Loading, empty and error states; design floor checklist passes | |
| I-011 | README, video script, submission text | claude | todo | M4 | presubmit passes; video uploaded; form drafted | |
| I-012 | Record and upload the video; submit on Devpost | human | todo | M4 | YouTube link public; Devpost shows submitted | |
| I-013 | Human checkout with PayPal JS SDK v6 buttons on the shop page | claude | parked | | | |
| I-014 | Shipment tracking from the seller dashboard | claude | parked | | | |

## Notes
Add a `### I-00N` section only when an issue needs more than its row.
