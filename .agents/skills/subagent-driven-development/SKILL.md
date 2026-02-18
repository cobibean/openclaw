---
name: subagent-driven-development
description: "Use when executing implementation plans with independent tasks. Dispatches fresh sub-agent per task with two-stage review (spec compliance then code quality)."
---

# Subagent-Driven Development

Execute plan by dispatching fresh sub-agent per task via `sessions_spawn`, with two-stage review after each: spec compliance review first, then code quality review.

**Core principle:** Fresh sub-agent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

- Have an implementation plan with independent tasks
- Tasks are mostly independent (not tightly coupled)
- Want automated quality gates between tasks

## The Process

For each task in the plan:

1. **Dispatch implementer sub-agent** — fresh context, full task text provided (don't make it read the plan file)
2. **Implementer works** — implements, tests, commits, self-reviews
3. **If implementer has questions** — answer them, re-dispatch if needed
4. **Dispatch spec reviewer sub-agent** — verifies code matches requirements (nothing more, nothing less)
5. **If spec issues found** — implementer fixes, re-review
6. **Dispatch code quality reviewer sub-agent** — verifies code is clean, tested, maintainable
7. **If quality issues found** — implementer fixes, re-review
8. **Mark task complete** — move to next task

After all tasks: dispatch final reviewer for the entire implementation.

## Implementer Prompt Template

When spawning an implementer sub-agent, include:

```
You are implementing Task N: [task name]

## Task Description
[FULL TEXT of task from plan — paste it, don't make sub-agent read the file]

## Context
[Where this fits, dependencies, architectural context]

## Before You Begin
If anything is unclear about requirements, approach, or dependencies — ask now.

## Your Job
1. Implement exactly what the task specifies
2. Write tests (TDD if specified)
3. Verify implementation works
4. Commit your work
5. Self-review: completeness, quality, YAGNI, test coverage
6. Report back: what you built, tests + results, files changed, any concerns

Work from: [directory]
Python: /home/cobi/pipeline-venv/bin/python
```

## Spec Reviewer Prompt Template

```
You are reviewing whether an implementation matches its specification.

## What Was Requested
[FULL TEXT of task requirements]

## What Implementer Claims They Built
[From implementer's report]

## CRITICAL: Do Not Trust the Report
Read the ACTUAL CODE. Compare to requirements line by line.

Verify:
- Missing requirements — did they skip anything?
- Extra/unneeded work — did they overbuild?
- Misunderstandings — did they solve the wrong problem?

Report:
- ✅ Spec compliant (if everything matches after code inspection)
- ❌ Issues found: [list what's missing or extra, with file:line references]
```

## Code Quality Reviewer Prompt Template

**Only dispatch AFTER spec compliance passes.**

```
You are reviewing code quality for Task N.

## What Was Implemented
[From implementer's report]

## Your Job
Review the implementation for:
- Code clarity and naming
- Test quality (real behavior, not mock behavior)
- Error handling
- DRY / YAGNI compliance
- Consistency with existing codebase patterns

Report:
- Strengths: [what's good]
- Issues: [Critical / Important / Minor with file:line]
- Assessment: Approved / Needs fixes
```

## Red Flags — STOP

- Never skip reviews (spec OR quality)
- Never proceed with unfixed issues
- Never dispatch parallel implementers on the same files (conflicts)
- Never make sub-agent read the plan file (provide full text)
- Never start code quality review before spec compliance passes
- If sub-agent asks questions — answer before letting them proceed

## Cost Consideration

This pattern uses 3 sub-agent invocations per task (implementer + 2 reviewers). For token-sensitive budgets:
- Use on critical/complex tasks
- For simple/low-risk tasks, self-review by implementer may be sufficient
- The two-stage review is most valuable for Strategy Factory output and pipeline code changes

## Adapted from

[obra/superpowers](https://github.com/obra/superpowers) — MIT License
