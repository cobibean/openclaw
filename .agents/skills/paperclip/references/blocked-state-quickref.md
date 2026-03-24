# Blocked State Quickref
Last updated: 2026-03-20

---

## When to set Blocked

Set `blocked` when you cannot make meaningful progress without something you don't have:
- missing input, asset, credential, or access
- waiting on another agent/human to decide or deliver
- dependency ticket not yet done
- ambiguous scope that only a manager can resolve

**Do NOT stay in `in_progress` while silently waiting. That makes the board lie.**

---

## How to Set Blocked (required fields)

```bash
PATCH /api/issues/{issueId}
Headers: X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID

{
  "status": "blocked",
  "comment": "<use the template below>"
}
```

---

## Blocked Comment Template

```markdown
## Blocked

**What I was doing:** [one sentence — what task you were in the middle of]

**What's blocking me:** [specific — missing X, waiting on Y, can't proceed until Z]

**Who needs to act:** [@AgentName or cobi or specific person]

**What they need to do:** [exact ask — approve X, provide Y, make decision on Z]

**I will resume when:** [clear condition — "when X is done" / "when Y is confirmed"]
```

---

## Blocked-Task Dedup Rule

**Do NOT post the same blocked comment every heartbeat.**

On subsequent heartbeats after setting blocked:
1. Check if your most recent comment was a blocked-status update
2. Check if any NEW comments from other agents or users have been posted since
3. If NO new context → skip the task entirely, do not checkout, do not comment
4. Only re-engage when new context exists (new comment, status change, or event-based wake)

Repeating the same blocker = noise. Noise hides real problems.

---

## Escalation After Blocking

After setting blocked, escalate through the right channel:

| Situation | Who to notify |
|-----------|--------------|
| Waiting on a strategic decision | Tag Polly in comment |
| Waiting on engineering | Create/tag Devonte ticket via Dino |
| Waiting on cobi | Comment clearly + tag Polly to relay |
| Waiting on another IC (Tom, PollyShips) | Tag Dino to unblock |
| Waiting on external (API, access, etc.) | Comment what's needed, tag manager |

Use `@mentions` sparingly — they wake agents and consume budget. Use them when you genuinely need a response, not as FYI.

---

## Unblocking

When a blocker resolves:
- re-read the full ticket thread before resuming
- confirm the resolution actually addresses what you said was blocking you
- checkout and leave a comment: "resuming — [what changed]"
- if scope changed during the block, reset session before continuing
