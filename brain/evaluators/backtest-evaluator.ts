import type { StrategyResult } from "../connectors/analyzer.js";

export type Verdict = "STRONG_CANDIDATE" | "MARGINAL_CANDIDATE" | "FAILED" | "INSUFFICIENT_DATA";
export type EdgeCategory = ">5%" | "2-5%" | "1-2%" | "<1%" | "negative" | "zero_bets";
export type SampleAssessment = "robust" | "adequate" | "borderline" | "insufficient";

export interface BacktestEvaluation {
  strategy: string;
  verdict: Verdict;
  oosEdge: number;
  oosEdgeCategory: EdgeCategory;
  oosBets: number;
  sampleSizeAssessment: SampleAssessment;
  isToOosDecay: number;
  overfitRisk: "low" | "moderate" | "high";
  suggestedNextSteps: string[];
}

function categorizeEdge(edge: number, bets: number): EdgeCategory {
  if (bets === 0) {
    return "zero_bets";
  }
  if (edge < 0) {
    return "negative";
  }
  if (edge >= 0.05) {
    return ">5%";
  }
  if (edge >= 0.02) {
    return "2-5%";
  }
  if (edge >= 0.01) {
    return "1-2%";
  }
  return "<1%";
}

function assessSampleSize(oosBets: number): SampleAssessment {
  if (oosBets >= 2000) {
    return "robust";
  }
  if (oosBets >= 500) {
    return "adequate";
  }
  if (oosBets >= 200) {
    return "borderline";
  }
  return "insufficient";
}

function assessOverfit(isEdge: number, oosEdge: number): "low" | "moderate" | "high" {
  if (oosEdge <= 0) {
    return "high";
  }
  const decay = isEdge - oosEdge;
  if (isEdge <= 0 && oosEdge > 0) {
    return "moderate";
  }
  if (decay > 0.05) {
    return "high";
  }
  if (decay > 0.02) {
    return "moderate";
  }
  return "low";
}

export function evaluateBacktest(result: StrategyResult): BacktestEvaluation {
  const oosEdge = result.out_of_sample.realized_edge;
  const oosBets = result.out_of_sample.eligible_bets;
  const isEdge = result.overall.realized_edge;
  const decay = isEdge - oosEdge;

  const edgeCategory = categorizeEdge(oosEdge, oosBets);
  const sampleAssessment = assessSampleSize(oosBets);
  const overfitRisk = assessOverfit(isEdge, oosEdge);

  let verdict: Verdict;
  if (oosBets < 200) {
    verdict = "INSUFFICIENT_DATA";
  } else if (oosEdge >= 0.02 && oosBets >= 500) {
    verdict = "STRONG_CANDIDATE";
  } else if (oosEdge > 0) {
    verdict = "MARGINAL_CANDIDATE";
  } else {
    verdict = "FAILED";
  }

  const steps: string[] = [];
  if (verdict === "STRONG_CANDIDATE") {
    steps.push("Consider for promotion to shadow trading");
    if (sampleAssessment === "borderline") {
      steps.push("Extend data window for more OOS bets");
    }
  }
  if (verdict === "MARGINAL_CANDIDATE") {
    steps.push("Parameter tuning may improve edge");
    steps.push("Extend data window to increase sample size");
  }
  if (overfitRisk === "high") {
    steps.push("Walk-forward validation recommended to check stability");
  }
  if (verdict === "FAILED") {
    steps.push("Consider abandoning this strategy");
  }

  return {
    strategy: result.strategy,
    verdict,
    oosEdge,
    oosEdgeCategory: edgeCategory,
    oosBets,
    sampleSizeAssessment: sampleAssessment,
    isToOosDecay: decay,
    overfitRisk,
    suggestedNextSteps: steps,
  };
}
