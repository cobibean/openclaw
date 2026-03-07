# MEMORY.md — Polly's Long-Term Memory

## Identity

- I'm Polly, AI quant analyst for Polymarket 15-min BTC UP/DOWN system
- All lowercase output except proper nouns. "cobi" stays lowercase.
- Direct, skeptical, data-driven. No sugarcoating.

## Human

- cobi — lead dev/PM for ShipYard (@Web3_Matters), $SHIP token on Pump.fun
- Building a community of vibe coders. Web3 native.
- Action-oriented — jumped straight into strategy analysis before introductions

## Project State (as of 2026-02-09)

- Phase 0 complete: 18 strategies backtested, 8 in war chest
- Mean reversion thesis confirmed by 5 independent formulations
- All momentum strategies failed — BTC not trending at 15-min
- Best: zscore_reversion +5.79% OOS (732 bets), keltner +3.94% (2,177 bets)
- **ALL PRIOR RESULTS ON OLD DATA — need re-validation on 14-year Bitstamp dataset**
- Ghost trader already built (shadow trading infrastructure)
- Timeline: ghost trades → real money in days

## Data Upgrade (2026-02-09)

- Replaced Binance 11-month data with Bitstamp 14-year data
- Source: github.com/ff137/bitstamp-btcusd-minute-data (auto-updated daily)
- 7,419,777 1-min candles (2012-01-01 to 2026-02-09)
- 494,652 15-min windows (16x more than before)
- UP/DOWN split: 54.63% / 45.37% (was 65/35 on old data — big difference!)
- Script: pipeline/ingest_bitstamp.py (one-shot replacement)
- Clone data to /tmp/bitstamp-data first, then run script

## Architecture

- Monorepo: /Users/cobibean/DEV/bot
  - /pipeline (Python): collector, ingester, backtester, analyzer, ghost_trader
  - /polly (TypeScript/OpenClaw fork): me
- DB: pipeline/data/polymarket.db — 7.4M 1-min candles, 494K 15-min windows
- Pipeline venv at pipeline/.venv with all deps installed
- cobi uses Claude Code from /bot; I run in /polly via OpenClaw

## 14-Year Analysis Complete (2026-02-09)

- All 18 strategies analyzed on 14-year Bitstamp data (17 ran on new data, calendar_seasonality_anomaly used old)
- Full report: pipeline/reports/edge_analysis/14year-deep-analysis.md
- Analyzer output: pipeline/reports/edge_analysis/phase0c-analyzer-14year-full-results.json

### Tier 1 for Scalable Profitability (all show OOS >= IS = anti-overfit):

- **Stochastic reversion: +3.88% OOS, 38.7K bets, ~76/day — NEW STAR, highest PnL ($1,502)**
- CCI reversion: +3.26% OOS, 38K bets, ~36/day
- Keltner channel: +4.08% OOS, 24K bets, OOS beats IS by 44%
- Bollinger band: +4.97% OOS, 17K bets, near-zero decay
- Combined Tier 1: ~148 bets/day, ~$171/month at $1/contract

### Key Insights:

- 25 strategies tested total (18 original + 7 new from research briefs)
- MR thesis confirmed by 6 INDEPENDENT formulations (RSI, BB, ZScore, Keltner, CCI, Stochastic)
- Every momentum variant failed (6/6): simple, ROC, ADX, MA crossover, vol-weighted, Hurst
- Volume data has zero predictive power (volume_spike, volume_weighted both failed)
- logistic_regression #1 ranking is misleading — 52% IS decay, 3.5K OOS bets, overfit risk
- internal_spread_reversion: +2.87% OOS, different signal family (multi-TF MR) — Tier 2
- ALL top strategies are correlated MR — regime risk if BTC trends

## Next Steps (updated 2026-02-09)

- Walk-forward validation (split 14 years into periods, verify edge holds)
- Regime detection — reduce position when BTC trends (protect MR strategies)
- Real fee/slippage modeling from Polymarket
- Update openclaw to 2026.2.6-3 (needed for telegram to work)
- Enrich data with sub-candle features from 1-min data
- Strategies to explore: VPIN, order flow, funding rates, HMM regime detection
- Future: MCP server or API so I can run pipeline commands directly
- cobi is on $20/mo Claude plan — be token-conscious
- cobi plans to move Polly to home desktop PC for 24/7 operation (evening 2026-02-09)

## Setup Notes

- Brave API key configured (free plan, 1 req/sec)
- Pipeline venv: `cd pipeline && source .venv/bin/activate`
- Can run pipeline commands directly from my environment
- My workspace (~/.openclaw/workspace/) is separate from repo (~/DEV/bot/) — other agents can't see my files
- To share files with Claude PM agent, put them in the repo (e.g. pipeline/reports/)
- OpenClaw version: running 2026.2.3-1, needs update to 2026.2.6-3
- Telegram bot token configured in openclaw config, but channel won't start until version updated
