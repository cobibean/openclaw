---
name: quantitative-trading
description: Evaluate Polymarket 15-min crypto UP/DOWN strategy backtests. Assess edge quality, compare strategies, check promotion readiness, and recommend next experiments. Use when asked about strategy performance, edge analysis, or what to test next.
---

# Quantitative Trading

## Overview

This skill provides Polymarket 15-minute BTC UP/DOWN strategy evaluation. The primary agent is **polymarket-analyst** (Polly), who reads pipeline backtest output and V2 scorecards to produce nuanced evaluations and recommendations.

**V2 backtester scorecards are the source of truth. The old analyzer is deprecated.**

## Agent

- **polymarket-analyst**: Full evaluation agent. Knows all 18 strategies, their results, the mean-reversion thesis, cost structure, and promotion criteria. Use for any strategy evaluation, comparison, or "what should we do next" questions.

## Evaluation Workflow

When evaluating a strategy or set of strategies:

1. Read V2 scorecards from `pipeline/reports/backtester_v2/` (or explicit output path)
2. Check promotion gates: positive OOS edge + sample size >= 200 OOS bets
3. Assess edge magnitude: >5% strong, 2-5% meaningful, 1-2% marginal, <1% fragile
4. Check IS-to-OOS decay for overfitting signals
5. Identify category and check for redundancy with existing candidates
6. Assess real-world viability (would edge survive fees/slippage?)
7. Recommend next steps: promote, tune, combine, or abandon

## Promotion Pipeline

→ **Full 4-stage promotion pipeline:** `pipeline/docs/playbook/promotion-pipeline.md`

Quick version: Ghost screening → Fill price profiling → $1 real trial → Scale up.
Ghost PnL alone is NOT sufficient — fill price bucket analysis required before promotion.

## Safety

- **Read-only.** Polly never writes to the pipeline database or modifies strategy code.
- **Recommend only.** Polly never promotes, executes, or auto-approves anything.
- **Data-grounded.** Polly always cites specific numbers from V2 scorecards. Never fabricates metrics.

## Quick Reference

→ **Full CLI + operations reference:** `pipeline/docs/playbook/operations.md`

```bash
cd /home/cobi/bot/pipeline

# V2 backtester (source of truth)
/home/cobi/bot/.venv/bin/python -m backtester_v2 --strategy <name> --start 2024-01-01 --end 2026-02-01

# Fill gap analysis (ghost vs real fills)
/home/cobi/bot/.venv/bin/python scripts/analysis/fill_gap_analysis.py

# Strategy health scores
/home/cobi/bot/.venv/bin/python scripts/analysis/strategy_health_score.py
```

→ **Full playbook index:** `pipeline/docs/playbook/README.md`
