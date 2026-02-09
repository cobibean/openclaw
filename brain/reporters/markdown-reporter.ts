import type { BacktestEvaluation } from "../evaluators/backtest-evaluator.js";
import type { ComparisonResult } from "../evaluators/comparison-evaluator.js";
import type { PromotionCheck } from "../evaluators/promotion-checker.js";

export function formatEvaluationReport(evaluation: BacktestEvaluation): string {
  return [
    `## ${evaluation.strategy}`,
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Verdict | **${evaluation.verdict}** |`,
    `| OOS Edge | ${(evaluation.oosEdge * 100).toFixed(2)}% (${evaluation.oosEdgeCategory}) |`,
    `| OOS Bets | ${evaluation.oosBets} (${evaluation.sampleSizeAssessment}) |`,
    `| IS-to-OOS Decay | ${(evaluation.isToOosDecay * 100).toFixed(2)}% |`,
    `| Overfit Risk | ${evaluation.overfitRisk} |`,
    "",
    "### Suggested Next Steps",
    "",
    ...evaluation.suggestedNextSteps.map((s) => `- ${s}`),
    "",
  ].join("\n");
}

export function formatComparisonReport(comparison: ComparisonResult): string {
  const lines: string[] = [
    "# Strategy Comparison Report",
    "",
    `**${comparison.topN} strong candidates** out of ${comparison.evaluations.length} strategies`,
    `**Dominant category:** ${comparison.dominantCategory}`,
    "",
    "## Ranking by OOS Edge",
    "",
    "| Rank | Strategy | OOS Edge | OOS Bets | Verdict |",
    "|------|----------|----------|----------|---------|",
  ];

  for (const [i, name] of comparison.rankingByEdge.entries()) {
    const e = comparison.evaluations.find((ev) => ev.strategy === name);
    if (!e) {
      continue;
    }
    lines.push(
      `| ${i + 1} | ${e.strategy} | ${(e.oosEdge * 100).toFixed(2)}% | ${e.oosBets} | ${e.verdict} |`,
    );
  }

  if (comparison.diversificationNotes.length > 0) {
    lines.push("", "## Diversification Notes", "");
    for (const note of comparison.diversificationNotes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

export function formatPromotionReport(checks: PromotionCheck[]): string {
  const lines: string[] = [
    "# Promotion Gate Report",
    "",
    "| Strategy | All Gates | Recommendation |",
    "|----------|----------|----------------|",
  ];

  for (const check of checks) {
    lines.push(
      `| ${check.strategy} | ${check.allGatesPass ? "PASS" : "FAIL"} | ${check.recommendation} |`,
    );
  }

  return lines.join("\n");
}
