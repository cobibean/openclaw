---
name: quantitative-trading
description: Polymarket 15-min crypto UP/DOWN strategy evaluation toolkit. Backtesting frameworks and risk metrics tailored to binary outcome markets.
metadata:
  openclaw:
    emoji: "\U0001F4C8"
---

# Quantitative Trading

Evaluation toolkit for Polymarket 15-minute BTC UP/DOWN binary prediction strategies.

## Sub-Skills

- **backtesting-frameworks**: Our backtester patterns, strategy ABC, feature builder, CLI, output format
- **risk-metrics-calculation**: Edge evaluation, promotion gates, cost-aware analysis for binary markets

## What This Covers

- Evaluating backtest results from `pipeline/backtester/output/`
- Reading analyzer reports from `pipeline/reports/edge_analysis/`
- Understanding the cost structure (ask prices, break-even hit rate, realized edge)
- Applying promotion criteria (positive OOS edge, sample size gates)
- Comparing strategies across categories (mean reversion, momentum, regime detection, ML, meta)

## Current State (as of 2026-02-09)

| Metric               | Value                                 |
| -------------------- | ------------------------------------- |
| Strategies tested    | 18                                    |
| Promotion candidates | 11                                    |
| War chest (keep)     | 8                                     |
| Data range           | 2025-03-25 to 2026-02-08              |
| Windows              | 30,721                                |
| Dominant signal      | Mean reversion                        |
| Best OOS edge        | +5.79% (zscore_reversion)             |
| Best sample size     | 4,729 OOS bets (time_of_day_baseline) |

## Key Numbers

- **Break-even hit rate:** ~50.77%
- **ask_up:** ~0.5070 | **ask_down:** ~0.5084
- **OOS fraction:** 20% (last 20% of predictions chronologically)
- **Sample size gate:** >= 200 eligible OOS bets

## CLI Quick Reference

```bash
# From pipeline/ directory:
python3 -m backtester --strategy <name> --start 2025-03-25 --end 2026-02-08
python3 -m analyzer --output-dir reports/edge_analysis/
python3 -m analyzer --tag my-tag
python3 test_backtester.py
python3 test_analyzer.py
```
