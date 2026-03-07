import { runPipelineCommand } from "./pipeline.js";

export interface BacktestOptions {
  strategy: string;
  start: string;
  end: string;
  lookbackWindows?: number;
  dbPath?: string;
  outputDir?: string;
}

/**
 * Run a single strategy backtest.
 */
export async function runBacktest(options: BacktestOptions): Promise<{
  outputPath: string;
  totalPredictions: number;
}> {
  const args: string[] = [
    "--strategy",
    options.strategy,
    "--start",
    options.start,
    "--end",
    options.end,
  ];

  if (options.lookbackWindows !== undefined) {
    args.push("--lookback-windows", String(options.lookbackWindows));
  }
  if (options.dbPath) {
    args.push("--db-path", options.dbPath);
  }
  if (options.outputDir) {
    args.push("--output-dir", options.outputDir);
  }

  const result = await runPipelineCommand("backtester", args, { timeout: 300_000 });

  if (result.exitCode !== 0) {
    throw new Error(`Backtest failed (exit ${result.exitCode}): ${result.stderr}`);
  }

  // Parse stdout: "output=<path>" and "predictions=<count>"
  const outputMatch = result.stdout.match(/output=(.+)/);
  const predsMatch = result.stdout.match(/predictions=(\d+)/);

  return {
    outputPath: outputMatch?.[1]?.trim() ?? "",
    totalPredictions: predsMatch ? Number(predsMatch[1]) : 0,
  };
}

/**
 * List all registered strategy names.
 * Hardcoded to match pipeline/backtester/__main__.py STRATEGY_NAMES.
 */
export const STRATEGY_NAMES = [
  "momentum_simple",
  "mean_reversion_rsi",
  "time_of_day_baseline",
  "autocorrelation_regime",
  "runs_test",
  "efficiency_ratio",
  "bollinger_band_reversion",
  "zscore_reversion",
  "cci_reversion",
  "roc_momentum",
  "keltner_channel_reversion",
  "atr_expansion_continuation",
  "volume_spike_momentum",
  "calendar_seasonality_anomaly",
  "hurst_exponent_momentum",
  "volatility_regime_filter",
  "confidence_gating_consensus",
  "logistic_regression_classifier",
] as const;
