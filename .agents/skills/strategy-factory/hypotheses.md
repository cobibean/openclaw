# Strategy Factory — Hypothesis Backlog

> Maintained by Strategy Factory agent. Mark hypotheses as `[TESTED]` after backtesting with result summary.
> File was recreated 2026-02-19 after migration preflight.

---

## Untested Hypotheses

### H-001: Bid-Ask Spread Regime Filter
**Category:** microstructure  
**Hypothesis:** Wide bid-ask spreads signal low liquidity and adverse selection; strategies fired during narrow-spread windows should outperform.  
**Features to use:** `spread_pct` from `windows_15m`  
**Implementation idea:** Gate existing signals by spread percentile; bet only when spread < 30th percentile of trailing 7-day distribution.

---

### H-002: Candle Body / Wick Ratio Asymmetry — [TESTED — FAILED]
**Category:** mean_reversion  
**Hypothesis:** When the upper wick significantly exceeds the lower wick (rejection of highs), the next 15-min candle reverts DOWN, and vice versa. Quantifiable via `(high - close) / (close - low)` ratio.  
**Features to use:** OHLCV from `btc_candles`  
**Implementation idea:** Long wick-to-body ratio → fade direction; short ratio → momentum continuation.
**Result (2026-02-21):** OOS hit rate 49.46%, gross edge -0.54%, net edge -1.15%. 4,258 OOS bets. Strategy: `wick_rejection_reversion`. Wick asymmetry is essentially noise at 15-min granularity — no predictive signal for next-candle direction.

---

### H-003: Consecutive Large-Range Candle Exhaustion — [TESTED — INCONCLUSIVE]
**Category:** statistical  
**Hypothesis:** After 3+ consecutive above-median range candles in the same direction, exhaustion reversion is likely within 1–2 candles.  
**Features to use:** Rolling ATR, directional streaks  
**Implementation idea:** Detect streaks of expanding same-directional candles; bet opposite direction on candle N+1.
**Result (2026-02-22):** V2 backtest (2024-01-01→2026-02-01) with relaxed params (min_streak=2, range_mult=0.75): 26 bets on 96 market windows, hit_rate=73.1%, realized_edge=+12.3%. FAILS 200-bet sample gate — physically impossible with ~96 V2 market windows available. Signal appears real but statistically inconclusive. Strategy: `large_range_exhaustion`. Ghost NOT activated. Revisit when live ghost data accumulates ≥50 bets.

---

### H-004: Opening Range Breakout (Hourly Anchor)
**Category:** microstructure  
**Hypothesis:** The first 15-min candle of each hour sets a range; breakouts above/below this range in the 2nd or 3rd 15-min window have follow-through momentum.  
**Features to use:** `window_start` epoch, OHLCV  
**Implementation idea:** Track hourly open/high/low; trigger on breakout from first sub-window's range.

---

### H-005: Volume Divergence from Price
**Category:** statistical  
**Hypothesis:** When price moves up but volume is declining (or vice versa), the move is unsupported and likely to reverse within 1–2 candles.  
**Features to use:** `volume` from btc_candles, price delta  
**Implementation idea:** Compute correlation(price_delta, volume_delta) over rolling 4 windows; negative correlation → fade the move.

---

### H-006: Time-of-Week Seasonality
**Category:** calendar  
**Hypothesis:** BTC exhibits different directional bias by day-of-week (e.g., Sunday opens are frequently DOWN, Friday afternoons frequently UP). Extending `calendar_seasonality_anomaly` to weekday granularity may improve edge.  
**Features to use:** `window_start` epoch → day_of_week  
**Implementation idea:** Fit hourly × day-of-week interaction; bet only in high-confidence bins.

---

### H-007: Shadow Prediction Confidence Decay
**Category:** ml  
**Hypothesis:** When the XGBoost shadow model's confidence has been decaying (p_up drifting toward 0.5) over the last 3 windows, the market is in a regime where no signal is reliable. Skip trading in these periods.  
**Features to use:** `shadow_predictions.p_up` rolling mean/std  
**Implementation idea:** Confidence filter: bet only when last 3 shadow predictions have std(p_up) > 0.05 AND abs(mean - 0.5) > 0.03.

---

### H-008: High-Low Range Z-Score with Volume Confirmation
**Category:** statistical  
**Hypothesis:** Candles with range Z-score > 2.0 AND volume Z-score > 1.5 are likely continuation candles; candles with high range but low volume are likely reversals.  
**Features to use:** range = high - low, volume  
**Implementation idea:** 2-factor classification: continuation if both Z-scores elevated; reversion if range high but volume low.

---

## Tested Hypotheses

### H-VWAP-ASYMMETRY: DOWN-only VWAP asymmetry
**Status:** [TESTED — PASSED]  
**Result:** OOS net edge +5.47%, 591 bets, hit rate 56.0%. Ghost activated.  
**Date:** ~2026-02-19

---

*Add new hypotheses above. When testing, move entry to Tested section with result.*
