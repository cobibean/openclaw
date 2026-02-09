import { describe, expect, it } from "vitest";
import type { StrategyResult } from "../connectors/analyzer.js";
import { evaluateBacktest } from "../evaluators/backtest-evaluator.js";
import { compareStrategies } from "../evaluators/comparison-evaluator.js";
import { checkPromotion } from "../evaluators/promotion-checker.js";

// Factory for test StrategyResult
function makeResult(overrides: Partial<StrategyResult>): StrategyResult {
  return {
    strategy: "test_strategy",
    version: "0.1.0",
    data_range: ["2025-03-25", "2026-02-08"],
    run_timestamp: "2026-02-09T01:25:13Z",
    source_file: "test.json",
    source_sha256: "abc123",
    total_predictions: 30000,
    no_bet_count: 27000,
    overall: {
      eligible_bets: 3000,
      directional_hits: 1650,
      directional_hit_rate: 0.55,
      avg_entry_cost: 0.507,
      break_even_hit_rate: 0.507,
      realized_edge: 0.043,
      avg_raw_edge: 0.04,
      avg_effective_edge: 0.04,
      total_pnl_proxy: 100,
      avg_pnl_proxy_per_bet: 0.033,
      positive_effective_edge_rate: 0.6,
    },
    out_of_sample: {
      eligible_bets: 700,
      directional_hits: 392,
      directional_hit_rate: 0.56,
      avg_entry_cost: 0.507,
      break_even_hit_rate: 0.507,
      realized_edge: 0.053,
      avg_raw_edge: 0.05,
      avg_effective_edge: 0.05,
      total_pnl_proxy: 30,
      avg_pnl_proxy_per_bet: 0.043,
      positive_effective_edge_rate: 0.65,
    },
    sample_size_gate_pass: true,
    positive_oos_edge_pass: true,
    promotion_candidate: true,
    ...overrides,
  };
}

describe("backtest-evaluator", () => {
  it("categorizes strong candidate correctly", () => {
    const result = makeResult({ strategy: "zscore_reversion" });
    const evaluation = evaluateBacktest(result);
    expect(evaluation.verdict).toBe("STRONG_CANDIDATE");
    expect(evaluation.oosEdgeCategory).toBe(">5%");
    expect(evaluation.sampleSizeAssessment).toBe("adequate");
  });

  it("categorizes failed strategy correctly", () => {
    const result = makeResult({
      strategy: "momentum_simple",
      out_of_sample: {
        ...makeResult({}).out_of_sample,
        realized_edge: -0.03,
        eligible_bets: 5000,
      },
    });
    const evaluation = evaluateBacktest(result);
    expect(evaluation.verdict).toBe("FAILED");
  });

  it("flags insufficient data", () => {
    const result = makeResult({
      out_of_sample: {
        ...makeResult({}).out_of_sample,
        eligible_bets: 50,
        realized_edge: 0.1,
      },
    });
    const evaluation = evaluateBacktest(result);
    expect(evaluation.verdict).toBe("INSUFFICIENT_DATA");
  });
});

describe("promotion-checker", () => {
  it("passes when all gates met", () => {
    const result = makeResult({});
    const check = checkPromotion(result);
    expect(check.allGatesPass).toBe(true);
  });

  it("fails when OOS edge is negative", () => {
    const result = makeResult({
      out_of_sample: {
        ...makeResult({}).out_of_sample,
        realized_edge: -0.01,
      },
    });
    const check = checkPromotion(result);
    expect(check.allGatesPass).toBe(false);
  });
});

describe("comparison-evaluator", () => {
  it("identifies dominant category", () => {
    const results = [
      makeResult({ strategy: "zscore_reversion" }),
      makeResult({ strategy: "bollinger_band_reversion" }),
      makeResult({ strategy: "keltner_channel_reversion" }),
      makeResult({
        strategy: "momentum_simple",
        out_of_sample: { ...makeResult({}).out_of_sample, realized_edge: -0.03 },
      }),
    ];
    const comparison = compareStrategies(results);
    expect(comparison.dominantCategory).toBe("MR");
    expect(comparison.diversificationNotes.length).toBeGreaterThan(0);
  });
});
