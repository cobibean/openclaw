---
name: writing-plans
description: "Use when you have a spec or requirements for a multi-step task, before touching code. Breaks work into bite-sized tasks with exact file paths, code, and verification steps."
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer (or sub-agent) has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Save plans to:** `workspace/plans/YYYY-MM-DD-<feature-name>.md`

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" — step
- "Run it to make sure it fails" — step
- "Implement the minimal code to make the test pass" — step
- "Run the tests and make sure they pass" — step
- "Commit" — step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Key Paths:**
- Pipeline: `/home/cobi/bot/pipeline` (or current repo root)
- Python: `/home/cobi/pipeline-venv/bin/python`
- Database: `/home/cobi/pipeline-data/polymarket.db`

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- Use `/home/cobi/pipeline-venv/bin/python` for all pipeline Python commands

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved. Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh sub-agents per task via `sessions_spawn`, review between tasks, fast iteration

**2. Parallel Dispatch** — I spawn multiple sub-agents for independent tasks simultaneously, review all results when done

**Which approach?"**

## Adapted from

[obra/superpowers](https://github.com/obra/superpowers) — MIT License
