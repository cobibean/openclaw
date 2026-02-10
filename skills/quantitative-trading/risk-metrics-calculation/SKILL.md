---
name: risk-metrics-calculation
description: Cost-aware edge evaluation for Polymarket binary markets. Analyzer metrics, promotion gates, OOS validation, and sample size reasoning.
metadata:
  openclaw:
    emoji: "\U0001F4CA"
---

# Risk Metrics Calculation

Our evaluation framework for Polymarket 15-minute BTC UP/DOWN binary prediction strategies. This is NOT traditional portfolio risk (VaR, Sharpe, etc.). Binary outcomes require different metrics.

## The Analyzer

The deterministic analyzer lives at `pipeline/analyzer/core.py`. It reads backtest JSON output and computes cost-aware metrics with an 80/20 in-sample/out-of-sample split.

### AnalysisConfig

```python
@dataclass(frozen=True)
class AnalysisConfig:
    ask_up: float              # Cost to buy UP (~0.5070)
    ask_down: float            # Cost to buy DOWN (~0.5084)
    fee_per_contract: float    # Exchange fee (currently 0.0)
    slippage_per_contract: float  # Modeled slippage (currently 0.0)
    oos_fraction: float        # OOS slice (0.2 = last 20%)
```

Default `ask_up` and `ask_down` are derived from Phase 0A collector data (average observed ask prices). Currently zero fees/slippage is the best-case assumption.

### SplitMetrics

Computed for both overall and OOS slices:

| Metric                         | Type  | Meaning                                           |
| ------------------------------ | ----- | ------------------------------------------------- |
| `eligible_bets`                | int   | Predictions with action != NO_BET                 |
| `directional_hits`             | int   | Correct UP/DOWN predictions                       |
| `directional_hit_rate`         | float | hits / eligible_bets                              |
| `avg_entry_cost`               | float | Average cost paid per bet                         |
| `break_even_hit_rate`          | float | Hit rate needed to break even                     |
| `realized_edge`                | float | hit_rate - break_even_hit_rate                    |
| `avg_raw_edge`                 | float | Mean of (implied_prob - entry_cost)               |
| `avg_effective_edge`           | float | Mean of raw_edge - fees - slippage                |
| `total_pnl_proxy`              | float | Sum of per-bet PnL (1-cost on win, -cost on loss) |
| `avg_pnl_proxy_per_bet`        | float | Average PnL per eligible bet                      |
| `positive_effective_edge_rate` | float | Fraction of bets with positive effective edge     |

### StrategyAnalysis

The top-level result for one strategy:

```python
@dataclass(frozen=True)
class StrategyAnalysis:
    strategy: str
    version: str
    data_range: list[str]       # ["2025-03-25", "2026-02-08"]
    run_timestamp: str
    source_file: str
    source_sha256: str          # Integrity check
    total_predictions: int
    no_bet_count: int
    overall: SplitMetrics       # Full dataset metrics
    out_of_sample: SplitMetrics # Last 20% metrics
    sample_size_gate_pass: bool # overall.eligible_bets >= 200
    positive_oos_edge_pass: bool # oos.realized_edge > 0
    promotion_candidate: bool   # Both gates pass
```

## The Math

### Break-Even Hit Rate

For a binary market where you pay `ask_price` for a contract that pays $1 on win:

```
break_even = avg_entry_cost + fee_per_contract + slippage_per_contract
```

With current costs: break_even ~ 0.5077 (50.77%)

### Realized Edge

```
realized_edge = directional_hit_rate - break_even_hit_rate
```

A strategy with 55% hit rate has ~4.2% edge. A strategy with 51% hit rate has ~0.2% edge. The margin is thin.

### Per-Bet PnL

```
win:  +1.0 - entry_cost - fee - slippage
loss: -entry_cost - fee - slippage
```

With ask_up = 0.507, a winning UP bet nets +$0.493, a losing UP bet costs -$0.507.

## OOS Validation

The analyzer uses a simple chronological split:

- **In-sample (IS):** First 80% of predictions
- **Out-of-sample (OOS):** Last 20% of predictions

This prevents look-ahead bias. The IS period is where the strategy "would have been developed." The OOS period tests whether the edge persists on unseen data.

### IS-to-OOS Decay

| Pattern                   | Signal                                       |
| ------------------------- | -------------------------------------------- |
| OOS ~ IS                  | Genuine edge (consistent)                    |
| OOS << IS                 | Overfitting (memorized training data)        |
| OOS > IS                  | Possible regime shift or noise (investigate) |
| IS negative, OOS positive | Suspicious. Could be random.                 |

**Example:** `runs_test` has IS +10.7% but OOS -9.8%. This is classic overfitting. The strategy found patterns in the training data that do not generalize.

## Promotion Gates

A strategy must pass ALL gates:

1. **positive_oos_edge_pass:** `oos.realized_edge > 0.0`
2. **sample_size_gate_pass:** `overall.eligible_bets >= 200`

Both must be true for `promotion_candidate = True`.

### Gate 2 Uses Overall, Not OOS

Note: the sample size gate checks **overall** eligible bets (>= 200), not OOS eligible bets. A strategy with 200 overall bets has ~40 OOS bets (20%). This is a low bar. When evaluating, always check the OOS bet count separately. 221 OOS bets is barely meaningful. 2,177 OOS bets is much more reliable.

## Sample Size Reasoning for Binary Outcomes

For a binary outcome (correct/incorrect), the standard error of hit rate is:

```
SE = sqrt(p * (1-p) / n)
```

Where `p` is the observed hit rate and `n` is the number of bets.

| OOS Bets | Hit Rate | 95% CI        | Edge CI         |
| -------- | -------- | ------------- | --------------- |
| 200      | 55.0%    | 48.1% - 61.9% | -2.7% to +11.1% |
| 500      | 55.0%    | 50.6% - 59.4% | -0.2% to +8.6%  |
| 1,000    | 55.0%    | 51.9% - 58.1% | +1.1% to +7.3%  |
| 2,000    | 55.0%    | 52.8% - 57.2% | +2.1% to +6.4%  |
| 5,000    | 55.0%    | 53.6% - 56.4% | +2.8% to +5.6%  |

At 732 OOS bets (zscore_reversion), a 56.6% hit rate gives a 95% CI of roughly 53.0% to 60.1%, meaning the true edge could be as low as +2.2% or as high as +9.3%.

## Analyzer CLI

```bash
# Run on all latest backtest outputs
python3 -m analyzer --output-dir reports/edge_analysis/

# Run with custom tag
python3 -m analyzer --tag my-analysis

# Run on specific files
python3 -m analyzer --input backtester/output/zscore_reversion_20260209T012513Z.json

# Override costs
python3 -m analyzer --fee-per-contract 0.01 --slippage-per-contract 0.005

# Override ask prices
python3 -m analyzer --ask-up 0.52 --ask-down 0.52

# Run tests
python3 test_analyzer.py
```

Output: JSON + markdown report at `pipeline/reports/edge_analysis/phase0c-analyzer-<tag>.{json,md}`
