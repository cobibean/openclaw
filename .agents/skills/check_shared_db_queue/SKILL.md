---
name: check_shared_db_queue
description: Check shared hub queue status and optionally process pending manual items one-by-one or in bulk.
---

# Check Shared DB Queue

Run the shared queue checker in summary mode first:

```bash
/home/cobi/bot/.venv/bin/python /home/cobi/bot/shared/agent-memory/scripts/check_shared_db_queue.py --mode summary
```

Then ask the user exactly:

**"one at a time or bang em all out at once?"**

- If user wants one item: run `--mode one-by-one`
- If user wants all pending items: run `--mode bulk`

Use verbose mode when debugging:

```bash
/home/cobi/bot/.venv/bin/python /home/cobi/bot/shared/agent-memory/scripts/check_shared_db_queue.py --mode one-by-one --verbose
```