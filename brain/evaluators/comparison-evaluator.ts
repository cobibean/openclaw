import type { StrategyResult } from "../connectors/analyzer.js";
import { evaluateBacktest, type BacktestEvaluation } from "./backtest-evaluator.js";

// Strategy categories matching our taxonomy
const CATEGORY_MAP: Record<string, string> = {
  zscore_reversion: "MR",
  bollinger_band_reversion: "MR",
  keltner_channel_reversion: "MR",
  mean_reversion_rsi: "MR",
  cci_reversion: "MR",
  momentum_simple: "MOM",
  roc_momentum: "MOM",
  hurst_exponent_momentum: "MOM",
  volume_spike_momentum: "VOL",
  atr_expansion_continuation: "VOL",
  autocorrelation_regime: "REGIME",
  runs_test: "REGIME",
  efficiency_ratio: "REGIME",
  volatility_regime_filter: "META",
  confidence_gating_consensus: "META",
  logistic_regression_classifier: "ML",
  time_of_day_baseline: "TIME",
  calendar_seasonality_anomaly: "TIME",
};

export interface ComparisonResult {
  evaluations: BacktestEvaluation[];
  rankingByEdge: string[];
  rankingBySampleSize: string[];
  categoryBreakdown: Record<string, string[]>;
  dominantCategory: string;
  diversificationNotes: string[];
  topN: number;
}

export function compareStrategies(results: StrategyResult[]): ComparisonResult {
  const evaluations = results.map(evaluateBacktest);

  const byEdge = [...evaluations].toSorted((a, b) => b.oosEdge - a.oosEdge).map((e) => e.strategy);

  const bySample = [...evaluations]
    .toSorted((a, b) => b.oosBets - a.oosBets)
    .map((e) => e.strategy);

  // Category breakdown
  const categories: Record<string, string[]> = {};
  for (const e of evaluations) {
    const cat = CATEGORY_MAP[e.strategy] ?? "OTHER";
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(e.strategy);
  }

  // Find dominant category among positive-edge strategies
  const positiveEdge = evaluations.filter((e) => e.oosEdge > 0);
  const catCounts: Record<string, number> = {};
  for (const e of positiveEdge) {
    const cat = CATEGORY_MAP[e.strategy] ?? "OTHER";
    catCounts[cat] = (catCounts[cat] ?? 0) + 1;
  }
  const dominantCategory =
    Object.entries(catCounts).toSorted(([, a], [, b]) => b - a)[0]?.[0] ?? "NONE";

  // Diversification notes
  const notes: string[] = [];
  const mrCount = catCounts.MR ?? 0;
  if (mrCount >= 3) {
    notes.push(
      `${mrCount} of ${positiveEdge.length} positive-edge strategies are mean reversion. ` +
        "They are likely correlated and measure the same underlying signal.",
    );
  }
  if (positiveEdge.length > 0 && Object.keys(catCounts).length <= 2) {
    notes.push("Low category diversity. Edge is concentrated in one signal type.");
  }

  return {
    evaluations,
    rankingByEdge: byEdge,
    rankingBySampleSize: bySample,
    categoryBreakdown: categories,
    dominantCategory,
    diversificationNotes: notes,
    topN: evaluations.filter((e) => e.verdict === "STRONG_CANDIDATE").length,
  };
}
