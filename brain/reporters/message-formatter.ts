import type { StrategyResult } from "../connectors/analyzer.js";
import type { BacktestEvaluation } from "../evaluators/backtest-evaluator.js";

export function formatShortSummary(evaluations: BacktestEvaluation[]): string {
  const strong = evaluations.filter((e) => e.verdict === "STRONG_CANDIDATE");
  const total = evaluations.length;

  if (strong.length === 0) {
    return `No strong candidates from ${total} strategies tested.`;
  }

  const top3 = strong
    .toSorted((a, b) => b.oosEdge - a.oosEdge)
    .slice(0, 3)
    .map((e) => `${e.strategy} (+${(e.oosEdge * 100).toFixed(1)}%)`)
    .join(", ");

  return `Top: ${top3}. ${strong.length}/${total} strong candidates.`;
}

export function formatNewBacktestAlert(result: StrategyResult): string {
  const edge = (result.out_of_sample.realized_edge * 100).toFixed(2);
  const bets = result.out_of_sample.eligible_bets;
  const status = result.promotion_candidate ? "CANDIDATE" : "FAILED";

  return `New backtest: ${result.strategy} | OOS edge: ${edge}% | ${bets} bets | ${status}`;
}
