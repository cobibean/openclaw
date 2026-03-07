# Whitelist Manager Skill

Promote or demote strategies for real-money trading. **Both steps are required** — a strategy without a timeframe gate will trade on ALL threads, which can lose money.

## Prerequisites

Before promoting any strategy, verify:
1. **Ghost PnL is positive on the target timeframe** (split by 15m/5m, source='live' only)
2. **Sufficient sample size** (≥50 resolved bets on the target timeframe)
3. **Fill price is reasonable** (avg fill < $0.55)
4. **cobi has explicitly approved** the promotion

## Promotion (2-step, BOTH required)

### Step 1: Add to whitelist
**File:** `pipeline/config/trading.yaml`
**Key:** `trading.real_money_strategies`

```yaml
trading:
  real_money_strategies:
    - semivariance_asymmetry    # added YYYY-MM-DD, 15m only
```

### Step 2: Set timeframe gate
**File:** `pipeline/config/strategy_profiles.yaml`
**Key:** `real_money_windows`

```yaml
real_money_windows:
  semivariance_asymmetry: [900]       # 15m only (900=15m, 300=5m)
```

**Window values:** `900` = 15m, `300` = 5m, `[300, 900]` = both.

> ⚠️ **FAIL-CLOSED:** Strategies with no `real_money_windows` entry are BLOCKED from writing signals. No entry = no signals = no real trades. This is intentional — you must always explicitly declare allowed timeframes.

### What happens
- Both files hot-reload every 60 seconds. No restart needed.
- Ghost trader continues collecting data on ALL threads (unaffected).
- Signal writer only writes files for approved timeframes.
- Real trader only executes whitelisted strategies.

## Demotion

### Remove from whitelist
Delete the strategy name from `trading.real_money_strategies` in `trading.yaml`.
Optionally remove (or leave) its `real_money_windows` entry — it's harmless without whitelist.

### Emergency halt
```bash
cd /home/cobi/bot/pipeline
/home/cobi/bot/.venv/bin/python -m ghost_trader --halt
```
Creates `data/TRADING_HALTED` — stops ALL real trading instantly.

## Verification after promotion

```bash
# Confirm whitelist loaded (check real trader logs)
tail -20 /home/cobi/bot/data/real_trader_runs/latest.log | grep -i "whitelist\|strategies"

# Confirm timeframe gate loaded
cd /home/cobi/bot/pipeline && /home/cobi/bot/.venv/bin/python -c "
from trader.filters import get_profiles
rmw = get_profiles().get('real_money_windows', {})
print('Timeframe gates:', rmw)
"

# Watch for first real trade
tail -f /home/cobi/bot/data/real_trader_runs/latest.log | grep -i "signal\|trade\|order"
```

## Critical rules
- **NEVER promote without cobi's explicit approval**
- **NEVER skip the timeframe gate** — strategies can be profitable on one thread and losing on another
- **NEVER promote a strategy with fill > $0.55** — break-even trap
- **ALL queries must use `source = 'live'`** — DB contains backfill data that inflates numbers
- **ALL performance must be evaluated per-timeframe** — never use combined 5m+15m stats for promotion decisions

## Key files
| File | Purpose |
|------|---------|
| `pipeline/config/trading.yaml` | Whitelist + trading limits (hot-reloaded 60s) |
| `pipeline/config/strategy_profiles.yaml` | Timeframe gates + entry caps + deferred entry (hot-reloaded 60s) |
| `ghost_trader/signal_writer.py` | `_is_window_allowed()` — enforces timeframe gate |
| `real_trader/runner.py` | `process_signal_file()` — enforces whitelist |
| `pipeline/docs/playbook/operations.md` | Full operations reference |
