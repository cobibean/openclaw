# Strategy Factory — Skill Guide

> Autonomously generate, backtest, and evaluate new BTC 15-min trading strategies for the Polymarket prediction pipeline.

## Overview

The Strategy Factory creates novel trading strategies that predict BTC 15-minute price direction (UP/DOWN) on Polymarket binary outcome markets. Each strategy implements the `Strategy` ABC from `strategies/base.py`, lives in an auto-discovered directory under `pipeline/strategies/`, and gets backtested + analyzed through the standard pipeline.

**You are an autonomous agent.** Generate hypotheses, write strategies, backtest them, evaluate results, and recommend promising candidates. You CANNOT promote strategies to live — only Polly (CEO) can do that.

## Architecture

```
pipeline/strategies/
├── base.py              ← Strategy ABC + Prediction dataclass (re-exports from backtester)
├── registry.py          ← Auto-discovery engine — scans for config.yaml + strategy.py
├── AGENTS.md            ← Quick-reference "How to Add a Strategy"
├── __init__.py          ← Re-exports base classes
├── post_close/          ← Post-close MR/ML strategies (12 strategies)
│   ├── zscore_reversion/
│   │   ├── config.yaml
│   │   ├── strategy.py
│   │   └── STRATEGY.md
│   ├── bollinger_band_reversion/
│   ├── cci_reversion/
│   ├── keltner_channel_reversion/
│   ├── stochastic_reversion/
│   ├── internal_spread_reversion/
│   ├── entropy_windowed_zscore/
│   ├── narrow_range_breakout_mr/
│   ├── confidence_gating_consensus/
│   ├── xgboost_classifier/
│   ├── logistic_regression_classifier/
│   └── streak_reversion/
├── intra/               ← Intra-window strategies (3 strategies)
│   ├── intra_early_fade/
│   ├── intra_fair_value_arb/
│   └── intra_late_momentum/
└── pm/                  ← Polymarket microstructure strategies (8 strategies)
    ├── pm_ob_imbalance/
    ├── pm_spread_asymmetry/
    ├── pm_liquidity_depth/
    ├── pm_mm_spread_signal/
    ├── pm_fair_value_divergence/
    ├── pm_last_minute_convergence/
    ├── pm_resolution_trajectory/
    └── pm_window_boundary_patterns/
```

**Registry auto-discovers strategies.** Drop a folder with `config.yaml` + `strategy.py` → it's found. No editing `__init__.py`, `__main__.py`, or any registration code.

### Supporting Pipeline Code

```
pipeline/
├── backtester/
│   ├── strategies/
│   │   └── base.py      ← Authoritative Strategy ABC + Prediction dataclass
│   ├── features.py      ← Feature builder (what data your strategy receives)
│   ├── runner.py         ← Executes backtest loop
│   └── __main__.py       ← Backtest CLI
├── analyzer/
│   ├── core.py           ← Computes edge metrics, OOS splits
│   ├── __main__.py       ← Analysis CLI
│   └── report.py         ← Markdown report generation
└── ghost_trader/         ← Live shadow trading (reads from registry)
```

## Strategy ABC Contract

Every strategy must:

```python
from strategies.base import Prediction, Strategy

class MyStrategy(Strategy):
    name = "my_strategy_name"  # unique snake_case — MUST match config.yaml name
    version = "0.1.0"

    def __init__(self, lookback_windows: int = 20, **params):
        self.lookback_windows = lookback_windows
        # store params...

    def required_lookback(self) -> int:
        return self.lookback_windows

    @property
    def config(self) -> dict[str, Any]:
        return {"lookback_windows": self.lookback_windows, ...}

    def predict(self, features: Mapping[str, Any]) -> Prediction:
        # Compute signal → return Prediction
        ...
```

### Prediction Output

```python
Prediction(
    window_epoch=int(features["window_epoch"]),
    p_up=0.55,              # probability estimate [0.0, 1.0]
    signal_strength=0.3,    # confidence [0.0, 1.0]
    action="UP",            # "UP" | "DOWN" | "NO_BET"
    metadata={...},         # debug info (logged, not used for scoring)
)
```

### Rules
- **NO LOOK-AHEAD**: `features` contains only data from windows BEFORE the target. Never access `close_price` of the current window.
- **Deterministic**: Same input → same output. No random seeds that change between runs.
- **NO_BET is valid**: If signal is weak, return NO_BET. Quality > quantity.
- **p_up must reflect true belief**: If you bet DOWN, p_up should be < 0.5.

## Step-by-Step: Create a New Strategy

### 1. Generate Hypothesis

Check `polly/.agents/skills/strategy-factory/hypotheses.md` for untested ideas, or derive a new one from:
- Market microstructure patterns
- Statistical anomalies in BTC 15-min returns
- Cross-timeframe relationships
- Temporal patterns not captured by existing strategies

### 2. Create Strategy Directory

```bash
mkdir -p pipeline/strategies/post_close/my_new_strategy
```

Categories: `post_close` (standard MR/ML), `intra` (intra-window), `pm` (Polymarket microstructure)

### 3. Write strategy.py

Use `polly/.agents/skills/strategy-factory/templates/strategy_template.py` as reference:

```python
"""My New Strategy — one-line description.

Strategy: my_new_strategy
Hypothesis: What market behavior this exploits
Category: mean_reversion | statistical | ml | microstructure | etc.
"""
from __future__ import annotations
from typing import Any, Mapping
from strategies.base import Prediction, Strategy

class MyNewStrategy(Strategy):
    name = "my_new_strategy"
    version = "0.1.0"

    def __init__(self, lookback_windows: int = 20, threshold: float = 2.0, **kwargs):
        self._lookback = lookback_windows
        self._threshold = threshold

    def required_lookback(self) -> int:
        return self._lookback

    @property
    def config(self) -> dict[str, Any]:
        return {"lookback_windows": self._lookback, "threshold": self._threshold}

    def predict(self, features: Mapping[str, Any]) -> Prediction:
        # Your signal logic here
        ...
```

### 4. Write config.yaml

This is the **registration file**. The registry reads it to discover and configure your strategy.

```yaml
name: my_new_strategy          # MUST match Strategy.name in strategy.py
version: "0.1.0"
category: mean_reversion       # Descriptive category tag
class_name: MyNewStrategy      # Class name in strategy.py
source_agent: strategy-factory # Who created this strategy

params:                        # Default parameters for 15-min backtests
  lookback_windows: 20
  threshold: 2.0

params_5m:                     # Override params for 5-min backtests (optional)
  lookback_windows: 20
  threshold: 1.5

mr_priority: null              # MR dedup priority (integer, lower = higher priority)
                               # Set only for mean_reversion strategies. null for non-MR.

active:                        # Activation flags — controls where the strategy runs
  ghost_15m: false             # Shadow trading on 15-min windows
  ghost_5m: false              # Shadow trading on 5-min windows
  real_15m: false              # Real money on 15-min windows (cobi-only decision)
  real_5m: false               # Real money on 5-min windows (cobi-only decision)

tags: [mean_reversion, simple] # Searchable tags for filtering/discovery
description: "One-line description of what the strategy does."
```

#### config.yaml Field Reference

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | ✅ | string | Must match `Strategy.name` in strategy.py |
| `version` | ✅ | string | Semver format |
| `category` | ✅ | string | Descriptive (mean_reversion, ml_ensemble, intra_window, polymarket_microstructure, etc.) |
| `class_name` | ✅ | string | Python class name in strategy.py |
| `source_agent` | ✅ | string | Who built it: `strategy-factory`, `legacy/human-built`, etc. |
| `params` | ✅ | dict | Default parameters passed to `__init__(**params)` |
| `params_5m` | ❌ | dict | Override params for 5-min windows. `{}` if same as 15m |
| `mr_priority` | ❌ | int/null | MR dedup priority. Only for MR strategies. Lower = higher priority |
| `active` | ✅ | dict | Four boolean flags controlling ghost/real × 15m/5m |
| `tags` | ❌ | list | Searchable tags |
| `description` | ❌ | string | One-line summary |
| `real_assets` | ❌ | dict | Asset-specific real trading (e.g., `15m: ["SOL"]` for intra strategies) |

### 5. Write STRATEGY.md

Document:
- What the strategy does (plain English)
- The hypothesis it tests
- When it works / when it fails
- Key parameters and their effects
- Known limitations

### 6. Backtest

```bash
cd /mnt/c/Users/jacob/DEV/bot/pipeline
/home/cobi/pipeline-venv/bin/python -m backtester \
  --strategy my_new_strategy \
  --start 2024-01-01 \
  --end 2026-02-01
```

Writes output JSON to `backtester/output/`.

**Date range guidance:**
- Full backtest: `--start 2024-01-01 --end 2026-02-01` (~2 years)
- Quick validation: `--start 2025-06-01 --end 2026-02-01` (~8 months)
- Analyzer uses last 20% as OOS by default

### 7. Analyze

```bash
/home/cobi/pipeline-venv/bin/python -m analyzer \
  --input backtester/output/my_new_strategy_*.json
```

Or analyze all latest outputs:
```bash
/home/cobi/pipeline-venv/bin/python -m analyzer
```

### 8. Evaluate Against Quality Gates

| Gate | Threshold | What It Means |
|------|-----------|---------------|
| Sample size | ≥ 200 eligible bets OOS | Enough data for statistical significance |
| OOS gross edge | > 0.0% | Beats coin flip out-of-sample |
| OOS net edge | > 0.0% | Profitable after 10% taker fee |
| Hit rate | > break-even (~60.7%) | Covers entry costs on 15-min crypto |
| Bet frequency | 5-50% of windows | Not too sparse, not too liberal |
| Signal stability | Consistent across time splits | Not just fitting one regime |

**Promotion criteria:** `promotion_candidate = sample_size_gate_pass AND positive_oos_edge_pass`

### 9. Activate for Ghost Trading

If the strategy passes quality gates, set `active.ghost_15m: true` in config.yaml. The ghost trader picks it up automatically on next restart. **Do NOT set real flags** — that's cobi's decision only.

### 10. Report Results

Write your findings to the agent output JSON (`workspace/council/strategy-factory/latest.json`) using the standard agent output schema.

## Available Features

The `features` dict passed to `predict()` contains:

### Core Price Data
| Key | Type | Description |
|-----|------|-------------|
| `window_epoch` | int | Target window epoch |
| `window_start` | str | ISO timestamp |
| `current_open_price` | float | Known at decision time |
| `close_prices` | list[float] | Last N close prices |
| `open_prices` | list[float] | Last N open prices |
| `high_prices` | list[float] | Last N highs |
| `low_prices` | list[float] | Last N lows |
| `volumes` | list[float] | Last N volume sums |

### Computed Indicators
| Key | Type | Description |
|-----|------|-------------|
| `last_n_returns` | list[float] | Return series (close-to-close %) |
| `momentum_score` | float | Mean return over lookback |
| `return_volatility` | float | Std dev of returns |
| `rsi_14` | float\|None | RSI (Cutler's variant) |
| `bb_position_20` | float\|None | Bollinger position [0=lower, 1=upper] |
| `zscore_20` | float\|None | Z-score vs 20-period mean |
| `atr_14` | float\|None | Average True Range |
| `ema_20` | float\|None | Exponential Moving Average |
| `volume_ratio_20` | float\|None | Current vol / 20-period avg |

### Time Features
| Key | Type | Description |
|-----|------|-------------|
| `hour_of_day` | int | UTC hour [0-23] |
| `day_of_week` | int | Monday=0, Sunday=6 |
| `minutes_since_midnight` | int | UTC minutes |

### Information-Theoretic Features
| Key | Type | Description |
|-----|------|-------------|
| `permutation_entropy` | float\|None | Bandt-Pompe PE [0=deterministic, 1=random] |
| `sample_entropy` | float\|None | SampEn (lower=more regular) |
| `lz_complexity` | float\|None | Lempel-Ziv [0=simple, 1=complex] |
| `hurst_change` | float\|None | Delta-Hurst (pos=trending, neg=MR) |

### History Context
| Key | Type | Description |
|-----|------|-------------|
| `history_labels` | list[str] | UP/DOWN labels of prior windows |
| `history_window_starts` | list[str] | Timestamps of prior windows |
| `history_micro` | list[dict\|None] | Micro features per prior window |

### Micro Features (via `history_micro[-1]`)
Available for the LAST COMPLETED window (strictly causal):
- `buy_volume`, `sell_volume`, `ofi` (order flow imbalance)
- `intra_return_skew`, `intra_return_kurtosis`
- `vwap`, `first_half_return`, `second_half_return`
- `direction_changes`, `max_drawdown`, `max_runup`
- `realized_volatility`, `body_to_range_ratio`
- `shannon_entropy`, `volume_acceleration`, `candle_count`

## Current Registry (23 Strategies)

### Post-Close (12)
| Strategy | Category | MR Priority | Real? |
|----------|----------|-------------|-------|
| zscore_reversion | mean_reversion | 50 | ❌ |
| bollinger_band_reversion | mean_reversion | 40 | ❌ |
| cci_reversion | mean_reversion | 60 | ❌ |
| keltner_channel_reversion | mean_reversion | 30 | ✅ |
| stochastic_reversion | mean_reversion | 70 | ❌ |
| internal_spread_reversion | mean_reversion | 80 | ❌ |
| entropy_windowed_zscore | information_theory | 45 | ❌ |
| narrow_range_breakout_mr | volatility | 90 | ❌ |
| streak_reversion | pattern | null | ❌ |
| confidence_gating_consensus | ml_ensemble | null | ❌ |
| xgboost_classifier | ml_ensemble | null | ✅ |
| logistic_regression_classifier | ml_classifier | null | ❌ |

### Intra-Window (3)
| Strategy | Real? | Real Assets |
|----------|-------|-------------|
| intra_early_fade | ❌ | — |
| intra_fair_value_arb | ❌ | — |
| intra_late_momentum | ✅ | SOL |

### Polymarket Microstructure (8)
| Strategy | Real? |
|----------|-------|
| pm_ob_imbalance | ❌ |
| pm_spread_asymmetry | ✅ |
| pm_liquidity_depth | ❌ |
| pm_mm_spread_signal | ❌ |
| pm_fair_value_divergence | ❌ |
| pm_last_minute_convergence | ❌ |
| pm_resolution_trajectory | ❌ |
| pm_window_boundary_patterns | ❌ |

## Strategy Design Principles

1. **Novel signal**: Don't repackage existing indicators. Find a genuinely different angle.
2. **Mean reversion is king**: BTC 15-min returns are confirmed mean-reverting over 14 years. Strategies that align with this thesis tend to perform best.
3. **Selective betting**: Better to bet on 10% of windows with 65% accuracy than 50% of windows with 52%.
4. **Regime awareness**: Mean reversion breaks during strong trends. Consider gating with entropy, volatility, or external signals.
5. **Simplicity wins**: Complex strategies with many parameters overfit. Prefer 2-4 parameters.
6. **Costs matter**: Entry costs on Polymarket 15-min crypto markets are ~55-60c. Break-even is ~60.7%. A 2% gross edge gets eaten by costs. Target 3%+ gross edge.
7. **The 60-strategy graveyard**: Most strategies look good in-sample. OOS is what matters. Be honest about what doesn't work.
8. **MR dedup**: All MR strategies are ~100% correlated. The ghost trader enforces max 1 MR bet per window via `mr_priority`. Set this field for any MR strategy.

## Shared State

Read `workspace/council/council-feedback-loops.md` before generating strategies. It contains:
- Current market regime (CALM/CAUTION/STORM)
- Active strategy list and recent performance
- Known issues and constraints
- Lessons learned from previous runs

**Honor all CONSTRAINT entries.** These are hard-won lessons from other agents (Cost Optimizer, Risk Manager, etc.).

## Output Format

Write results to `workspace/council/strategy-factory/latest.json` using the standard agent output schema:

```json
{
  "agent": "strategy-factory",
  "lastRun": "2026-02-18T09:00:00Z",
  "durationSeconds": 300,
  "model": "sonnet-4.6",
  "tokensUsed": { "input": 0, "output": 0, "total": 0 },
  "status": "healthy",
  "summary": "Tested H3 (streak counter). OOS edge +2.1%, 245 bets. Recommend ghost activation.",
  "details": {
    "hypothesis": "H3",
    "strategy_name": "streak_counter_reversion",
    "backtest_range": "2024-01-01 to 2026-02-01",
    "oos_edge_pct": 2.1,
    "oos_bets": 245,
    "oos_hit_rate": 62.8,
    "is_edge_pass": true,
    "is_sample_pass": true,
    "recommendation": "activate_ghost"
  },
  "alerts": [],
  "constraints": []
}
```

## Tips

- Use `_no_bet()` helper pattern (see zscore_reversion/strategy.py) for clean NO_BET returns
- Set `needs_micro_features = True` class attr if you use micro features (triggers extra data loading)
- The `history_labels` list tells you what direction BTC actually moved in recent windows — useful for adaptive strategies
- `pstdev` from `statistics` module is used everywhere for population std dev
- Keep imports minimal — standard library + numpy only (avoid heavy deps)
- Check existing strategies before building — don't duplicate what's already covered
- The registry auto-discovers on import — no restart needed for ghost trader to pick up new strategies (though it only reads registry at startup)
