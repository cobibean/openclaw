---
name: test-driven-development
description: "Use when implementing any feature or bugfix, before writing implementation code. Enforces RED-GREEN-REFACTOR cycle."
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## Red-Green-Refactor

### RED — Write Failing Test

Write one minimal test showing what should happen.

**Good:**
```python
def test_get_real_strategies_returns_whitelisted():
    result = get_real_strategies("15m")
    assert isinstance(result, list)
    assert "keltner_channel_reversion" in result
```
Clear name, tests real behavior, one thing.

**Bad:**
```python
def test_stuff():
    # tests three different things
    assert get_real_strategies("15m")
    assert get_real_strategies("5m") is not None
    assert len(get_real_strategies("15m")) > 0
```
Vague name, tests multiple things.

### Verify RED — Watch It Fail

**MANDATORY. Never skip.**

```bash
cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest tests/test_file.py::test_name -v
```

Confirm:
- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

### GREEN — Minimal Code

Write simplest code to pass the test. Don't add features beyond the test.

### Verify GREEN — Watch It Pass

**MANDATORY.**

```bash
cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest tests/test_file.py::test_name -v
```

Confirm all tests pass, output clean.

### REFACTOR — Clean Up

After green only: remove duplication, improve names, extract helpers. Keep tests green. Don't add behavior.

## Common Rationalizations (all wrong)

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "TDD will slow me down" | TDD faster than debugging. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |

## Pipeline-Specific Notes

```bash
# Run all tests
cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest -v

# Run specific test
cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest tests/test_file.py::test_name -v

# Run with coverage
cd pipeline && /home/cobi/pipeline-venv/bin/python -m pytest --cov=. -v
```

**Known:** 11 pre-existing test failures (stale fixtures from 2026-02-13 audit). Don't count these as your failures, but don't add new ones.

## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass (excluding known pre-existing failures)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

## Adapted from

[obra/superpowers](https://github.com/obra/superpowers) — MIT License
