# STATE

Updated (UTC): 2026-11-11T05:17Z
Verified at commit: none (first commit pending)
Phase: tracer bullet (Gate A and Gate B passed)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Local toolchain: Node 22.20.0, git (E-001). No application code yet.

## Broken or known issues
- None recorded.

## In progress
- I-001 dependency verification (claude): waiting on PayPal sandbox credentials.
- I-002 PayPal developer account and sandbox app (human).

## Next action
1. Human: create the PayPal developer account and sandbox REST app; put the client ID, secret and Anthropic key in `.env`.
2. Claude: scaffold the Node service and build the tracer bullet (I-004) against the sandbox.

## Blockers and waiting on
- PayPal developer account (human, I-002). Every PayPal call waits on it.

## Open unknowns
- Whether the human's country can open a PayPal developer account (UNKNOWN until signup).
- Which assistants consume WebMCP natively today (UNKNOWN; in-page agent and MCP endpoint cover it).
