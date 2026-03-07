---
name: backtesting-frameworks
description: Our backtester architecture, strategy ABC pattern, feature builder, registration, CLI, and output format. Reference when building or evaluating strategies.
metadata:
  openclaw:
    emoji: "\U0001F9EA"
---

# Backtesting Frameworks

Our deterministic backtester for Polymarket 15-minute BTC UP/DOWN binary predictions. No external frameworks. No AI in the pipeline. Given the same inputs, always the same outputs.

## Strategy ABC Pattern

All strategies extend the base class at `pipeline/backtester/strategies/base.py`:

```python
class Strategy(ABC):
    name: str          # e.g. "zscore_reversion"
    version: str       # e.g. "0.1.0"

    def required_lookback(self) -> int:
        """How many prior windows are needed for features."""

    def predict(self, features: Mapping[str, Any]) -> Prediction:
        """Make one prediction from leakage-safe features."""

    @property
    def config(self) -> dict[str, Any]:
        """Serializable strategy configuration."""
```

### Prediction Dataclass

```python
@dataclass(frozen=True)
class Prediction:
    window_epoch: int       # Unix epoch of the target window
    p_up: float             # Probability of UP [0.0, 1.0]
    signal_strength: float  # Confidence in the signal [0.0, 1.0]
    action: str             # "UP", "DOWN", or "NO_BET"
    metadata: dict          # Strategy-specific debug info
```

**Constraints:**

- `action` must be one of: `"UP"`, `"DOWN"`, `"NO_BET"`
- `p_up` must be in `[0.0, 1.0]`
- `signal_strength` must be in `[0.0, 1.0]`
- When `action` is `"NO_BET"`, set `p_up = 0.5` and `signal_strength = 0.0`

## Feature Builder

`pipeline/backtester/features.py` provides `build_features_for_index(windows, index, lookback_windows)`.

**Strict no-leakage rule:** Features are built ONLY from windows strictly before `index`. The target window's close price and label are never visible to the strategy.

### Available Features

| Feature              | Type          | Description                                 |
| -------------------- | ------------- | ------------------------------------------- |
| `window_epoch`       | int           | Unix epoch of target window                 |
| `current_open_price` | float         | Target window open (known at decision time) |
| `last_n_returns`     | list[float]   | Lookback window returns                     |
| `momentum_score`     | float         | Mean of last_n_returns                      |
| `return_volatility`  | float         | Pstdev of last_n_returns                    |
| `rsi_14`             | float or None | 14-period RSI                               |
| `hour_of_day`        | int           | 0-23 UTC                                    |
| `day_of_week`        | int           | 0=Monday, 6=Sunday                          |
| `close_prices`       | list[float]   | Lookback close prices                       |
| `open_prices`        | list[float]   | Lookback open prices                        |
| `high_prices`        | list[float]   | Lookback high prices                        |
| `low_prices`         | list[float]   | Lookback low prices                         |
| `volumes`            | list[float]   | Lookback volumes                            |
| `bb_position_20`     | float or None | Bollinger Band position [0=lower, 1=upper]  |
| `zscore_20`          | float or None | Z-score vs 20-period mean                   |
| `atr_14`             | float or None | 14-period Average True Range                |
| `ema_20`             | float or None | 20-period EMA                               |
| `volume_ratio_20`    | float or None | Current volume / 20-period SMA              |
| `history_labels`     | list[str]     | Labels from lookback windows (UP/DOWN)      |

## Strategy Registration

To add a new strategy, four files must be updated:

1. **Create** `pipeline/backtester/strategies/<name>.py` with a class extending `Strategy`
2. **Add export** to `pipeline/backtester/strategies/__init__.py` in `__all__`
3. **Add name** to `STRATEGY_NAMES` list in `pipeline/backtester/__main__.py`
4. **Add case** to `_build_strategy()` in `pipeline/backtester/__main__.py`

## CLI

All commands run from `pipeline/` directory:

```bash
# Run a single strategy backtest
python3 -m backtester --strategy zscore_reversion --start 2025-03-25 --end 2026-02-08

# Override lookback
python3 -m backtester --strategy zscore_reversion --start 2025-03-25 --end 2026-02-08 --lookback-windows 30

# Custom output directory
python3 -m backtester --strategy zscore_reversion --start 2025-03-25 --end 2026-02-08 --output-dir my_output/

# Run tests
python3 test_backtester.py
```

## Output Format

Backtest results are saved as JSON at `pipeline/backtester/output/<strategy>_<timestamp>.json`:

```json
{
  "strategy": "zscore_reversion",
  "version": "0.1.0",
  "data_range": ["2025-03-25", "2026-02-08"],
  "timestamp": "2026-02-09T01:25:13Z",
  "total_predictions": 30701,
  "config": {
    "lookback_windows": 20,
    "entry_threshold": 2.0,
    "exit_threshold": 0.5
  },
  "predictions": [
    {
      "window_epoch": 1742860500,
      "p_up": 0.42,
      "signal_strength": 0.65,
      "action": "DOWN",
      "metadata": { "zscore": -2.31, "threshold": 2.0 }
    }
  ],
  "actuals": ["UP", "DOWN", "UP"]
}
```

`predictions` and `actuals` are aligned by index. The analyzer reads these files for cost-aware evaluation.

## Current Strategies (18)

| Name                           | Category         | Default Lookback |
| ------------------------------ | ---------------- | ---------------- |
| momentum_simple                | Momentum         | 3                |
| mean_reversion_rsi             | Mean Reversion   | 14               |
| time_of_day_baseline           | Calendar         | 1,344            |
| autocorrelation_regime         | Regime Detection | 20               |
| runs_test                      | Regime Detection | 30               |
| efficiency_ratio               | Regime Detection | 10               |
| bollinger_band_reversion       | Mean Reversion   | 20               |
| zscore_reversion               | Mean Reversion   | 20               |
| cci_reversion                  | Mean Reversion   | 20               |
| roc_momentum                   | Momentum         | 4                |
| keltner_channel_reversion      | Mean Reversion   | 20               |
| atr_expansion_continuation     | Volatility       | 50               |
| volume_spike_momentum          | Volume           | 20               |
| calendar_seasonality_anomaly   | Calendar         | 8,640            |
| hurst_exponent_momentum        | Regime Detection | 100              |
| volatility_regime_filter       | Meta             | 960              |
| confidence_gating_consensus    | Meta             | 8,640            |
| logistic_regression_classifier | ML               | 5,000            |
