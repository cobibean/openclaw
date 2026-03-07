import { describe, expect, it } from "vitest";
import type { BacktestEvaluation } from "../evaluators/backtest-evaluator.js";
import {
  formatComparisonReport,
  formatEvaluationReport,
  formatPromotionReport,
} from "../reporters/markdown-reporter.js";
import { formatNewBacktestAlert, formatShortSummary } from "../reporters/message-formatter.js";

describe("reporters", () => {
  const evaluation: BacktestEvaluation = {
    strategy: "zscore_reversion",
    verdict: "STRONG_CANDIDATE",
    oosEdge: 0.0579,
    oosEdgeCategory: ">5%",
    oosBets: 732,
    sampleSizeAssessment: "adequate",
    isToOosDecay: -0.0407,
    overfitRisk: "low",
    suggestedNextSteps: ["Consider for promotion to shadow trading"],
  };

  it("formats evaluation markdown", () => {
    const text = formatEvaluationReport(evaluation);
    expect(text).toContain("## zscore_reversion");
    expect(text).toContain("STRONG_CANDIDATE");
  });

  it("formats comparison markdown", () => {
    const text = formatComparisonReport({
      evaluations: [evaluation],
      rankingByEdge: ["zscore_reversion"],
      rankingBySampleSize: ["zscore_reversion"],
      categoryBreakdown: { MR: ["zscore_reversion"] },
      dominantCategory: "MR",
      diversificationNotes: ["Low category diversity."],
      topN: 1,
    });
    expect(text).toContain("# Strategy Comparison Report");
    expect(text).toContain("zscore_reversion");
  });

  it("formats promotion markdown", () => {
    const text = formatPromotionReport([
      {
        strategy: "zscore_reversion",
        gates: [],
        allGatesPass: true,
        recommendation: "Strong promotion candidate.",
      },
    ]);
    expect(text).toContain("# Promotion Gate Report");
    expect(text).toContain("PASS");
  });

  it("formats short summary", () => {
    const text = formatShortSummary([evaluation]);
    expect(text).toContain("Top:");
    expect(text).toContain("1/1 strong candidates");
  });

  it("formats new backtest alert", () => {
    const text = formatNewBacktestAlert({
      strategy: "zscore_reversion",
      version: "0.1.0",
      data_range: ["2025-03-25", "2026-02-08"],
      run_timestamp: "2026-02-09T01:25:13Z",
      source_file: "x",
      source_sha256: "y",
      total_predictions: 30701,
      no_bet_count: 27153,
      overall: {
        eligible_bets: 3548,
        directional_hits: 1862,
        directional_hit_rate: 0.5248,
        avg_entry_cost: 0.5076,
        break_even_hit_rate: 0.5076,
        realized_edge: 0.0171,
        avg_raw_edge: 0.0663,
        avg_effective_edge: 0.0663,
        total_pnl_proxy: 60.85,
        avg_pnl_proxy_per_bet: 0.0171,
        positive_effective_edge_rate: 0.9044,
      },
      out_of_sample: {
        eligible_bets: 732,
        directional_hits: 414,
        directional_hit_rate: 0.5655,
        avg_entry_cost: 0.5076,
        break_even_hit_rate: 0.5076,
        realized_edge: 0.0579,
        avg_raw_edge: 0.0669,
        avg_effective_edge: 0.0669,
        total_pnl_proxy: 42.41,
        avg_pnl_proxy_per_bet: 0.0579,
        positive_effective_edge_rate: 0.9112,
      },
      sample_size_gate_pass: true,
      positive_oos_edge_pass: true,
      promotion_candidate: true,
    });
    expect(text).toContain("New backtest: zscore_reversion");
    expect(text).toContain("CANDIDATE");
  });
});
