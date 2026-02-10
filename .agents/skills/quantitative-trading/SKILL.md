---
name: quantitative-trading
description: Evaluate Polymarket 15-min crypto UP/DOWN strategy backtests. Assess edge quality, compare strategies, check promotion readiness, and recommend next experiments. Use when asked about strategy performance, edge analysis, or what to test next.
---

# Quantitative Trading

## Overview

This skill provides Polymarket 15-minute BTC UP/DOWN strategy evaluation. The primary agent is **polymarket-analyst** (Polly), who reads pipeline backtest output and analyzer reports to produce nuanced evaluations and recommendations.

## Agent

- **polymarket-analyst**: Full evaluation agent. Knows all 18 strategies, their results, the mean-reversion thesis, cost structure, and promotion criteria. Use for any strategy evaluation, comparison, or "what should we do next" questions.

## Evaluation Workflow

When evaluating a strategy or set of strategies:

1. Read the analyzer report (JSON or markdown) from `pipeline/reports/edge_analysis/`
2. Check promotion gates: positive OOS edge + sample size >= 200 OOS bets
3. Assess edge magnitude: >5% strong, 2-5% meaningful, 1-2% marginal, <1% fragile
4. Check IS-to-OOS decay for overfitting signals
5. Identify category and check for redundancy with existing candidates
6. Assess real-world viability (would edge survive fees/slippage?)
7. Recommend next steps: promote, tune, combine, or abandon

## Promotion Checklist

Before recommending a strategy for promotion to shadow trading:

- [ ] Positive OOS realized edge after modeled costs
- [ ] At least 200 eligible OOS bets
- [ ] IS-to-OOS decay is reasonable (not massive overfitting)
- [ ] Edge magnitude likely survives real fees (~1% minimum)
- [ ] Strategy is not redundant with a better-performing existing candidate
- [ ] [Future] Consistent across 2+ distinct time periods

## Safety

- **Read-only.** Polly never writes to the pipeline database or modifies strategy code.
- **Recommend only.** Polly never promotes, executes, or auto-approves anything.
- **Data-grounded.** Polly always cites specific numbers from analyzer reports. Never fabricates metrics.

## Quick Reference

```bash
# Run backtester (from pipeline/)
python3 -m backtester --strategy <name> --start 2025-03-25 --end 2026-02-08

# Run analyzer (from pipeline/)
python3 -m analyzer --output-dir reports/edge_analysis/

# Run analyzer with tag
python3 -m analyzer --tag my-analysis

# Key file locations
pipeline/backtester/output/          # Backtest JSON outputs
pipeline/reports/edge_analysis/      # Analyzer reports (JSON + markdown)
pipeline/data/polymarket.db          # SQLite database
```

## Current State (as of 2026-02-09)

- 18 strategies tested, 11 promotion candidates, 8 in war chest
- Mean reversion thesis confirmed by 5 independent formulations
- Top 3: zscore_reversion (+5.79%), bollinger_band_reversion (+4.67%), keltner_channel_reversion (+3.94%)
- All momentum strategies failed with negative OOS edge
- Data: 30,721 fifteen-minute windows (2025-03-25 to 2026-02-08)
