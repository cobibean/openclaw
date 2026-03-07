# check_shared_db_queue

Manual helper for shared queue triage.

## Commands

Summary:

```bash
/home/cobi/bot/.venv/bin/python /home/cobi/bot/shared/agent-memory/scripts/check_shared_db_queue.py --mode summary
```

One pending item:

```bash
/home/cobi/bot/.venv/bin/python /home/cobi/bot/shared/agent-memory/scripts/check_shared_db_queue.py --mode one-by-one
```

Bulk process pending items:

```bash
/home/cobi/bot/.venv/bin/python /home/cobi/bot/shared/agent-memory/scripts/check_shared_db_queue.py --mode bulk
```

## Notes

- Summary prints status counts, oldest pending age, and top five pending items.
- `one-by-one` processes exactly one pending item by shared policy.
- `bulk` processes all pending items by shared policy.
- Gray-band items (45-55 final confidence) remain `pending_manual`.
