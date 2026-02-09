import type { StrategyResult } from "../connectors/analyzer.js";

export interface GateResult {
  pass: boolean;
  value: number;
  threshold: number;
  label: string;
}

export interface PromotionCheck {
  strategy: string;
  gates: GateResult[];
  allGatesPass: boolean;
  recommendation: string;
}

export function checkPromotion(result: StrategyResult): PromotionCheck {
  const gates: GateResult[] = [
    {
      label: "Positive OOS realized edge",
      pass: result.out_of_sample.realized_edge > 0,
      value: result.out_of_sample.realized_edge,
      threshold: 0,
    },
    {
      label: "Sample size >= 200 eligible bets",
      pass: result.overall.eligible_bets >= 200,
      value: result.overall.eligible_bets,
      threshold: 200,
    },
    {
      label: "OOS bet count >= 200",
      pass: result.out_of_sample.eligible_bets >= 200,
      value: result.out_of_sample.eligible_bets,
      threshold: 200,
    },
  ];

  const allPass = gates.every((g) => g.pass);

  let recommendation: string;
  if (allPass && result.out_of_sample.realized_edge >= 0.02) {
    recommendation = "Strong promotion candidate. Recommend shadow trading evaluation.";
  } else if (allPass) {
    recommendation = "Passes gates but edge is thin. Consider parameter tuning first.";
  } else {
    const failing = gates.filter((g) => !g.pass).map((g) => g.label);
    recommendation = `Fails gate(s): ${failing.join(", ")}. Not ready for promotion.`;
  }

  return {
    strategy: result.strategy,
    gates,
    allGatesPass: allPass,
    recommendation,
  };
}
