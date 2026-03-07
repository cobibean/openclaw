import { readFile } from "node:fs/promises";
import { runPipelineCommand } from "./pipeline.js";

// Matches pipeline/analyzer/core.py SplitMetrics
export interface SplitMetrics {
  eligible_bets: number;
  directional_hits: number;
  directional_hit_rate: number;
  avg_entry_cost: number;
  break_even_hit_rate: number;
  realized_edge: number;
  avg_raw_edge: number;
  avg_effective_edge: number;
  total_pnl_proxy: number;
  avg_pnl_proxy_per_bet: number;
  positive_effective_edge_rate: number;
}

// Matches pipeline/analyzer/core.py StrategyAnalysis
export interface StrategyResult {
  strategy: string;
  version: string;
  data_range: [string, string];
  run_timestamp: string;
  source_file: string;
  source_sha256: string;
  total_predictions: number;
  no_bet_count: number;
  overall: SplitMetrics;
  out_of_sample: SplitMetrics;
  sample_size_gate_pass: boolean;
  positive_oos_edge_pass: boolean;
  promotion_candidate: boolean;
}

export interface AnalyzerConfig {
  ask_up: number;
  ask_down: number;
  fee_per_contract: number;
  slippage_per_contract: number;
  oos_fraction: number;
}

export interface AnalyzerOutput {
  config: AnalyzerConfig;
  strategies: StrategyResult[];
}

export interface RunAnalyzerOptions {
  inputFiles?: string[];
  outputDir?: string;
  tag?: string;
  feePerContract?: number;
  slippagePerContract?: number;
  askUp?: number;
  askDown?: number;
  oosFraction?: number;
}

/**
 * Run the pipeline analyzer and return parsed results.
 */
export async function runAnalyzer(options?: RunAnalyzerOptions): Promise<{
  jsonPath: string;
  mdPath: string;
  strategies: StrategyResult[];
}> {
  const args: string[] = [];

  if (options?.outputDir) {
    args.push("--output-dir", options.outputDir);
  }
  if (options?.tag) {
    args.push("--tag", options.tag);
  }
  if (options?.feePerContract !== undefined) {
    args.push("--fee-per-contract", String(options.feePerContract));
  }
  if (options?.slippagePerContract !== undefined) {
    args.push("--slippage-per-contract", String(options.slippagePerContract));
  }
  if (options?.askUp !== undefined) {
    args.push("--ask-up", String(options.askUp));
  }
  if (options?.askDown !== undefined) {
    args.push("--ask-down", String(options.askDown));
  }
  if (options?.oosFraction !== undefined) {
    args.push("--oos-fraction", String(options.oosFraction));
  }
  if (options?.inputFiles) {
    for (const file of options.inputFiles) {
      args.push("--input", file);
    }
  }

  const result = await runPipelineCommand("analyzer", args);

  if (result.exitCode !== 0) {
    throw new Error(`Analyzer failed (exit ${result.exitCode}): ${result.stderr}`);
  }

  // Parse stdout for file paths: "json=<path>" and "markdown=<path>"
  const jsonMatch = result.stdout.match(/json=(.+)/);
  const mdMatch = result.stdout.match(/markdown=(.+)/);

  if (!jsonMatch) {
    throw new Error(`Could not find JSON path in analyzer output: ${result.stdout}`);
  }

  const jsonPath = jsonMatch[1].trim();
  const mdPath = mdMatch?.[1]?.trim() ?? "";

  const strategies = await parseAnalyzerJson(jsonPath);

  return { jsonPath, mdPath, strategies };
}

/**
 * Parse an existing analyzer JSON file.
 */
export async function parseAnalyzerJson(jsonPath: string): Promise<StrategyResult[]> {
  const content = await readFile(jsonPath, "utf-8");
  const parsed: AnalyzerOutput = JSON.parse(content) as AnalyzerOutput;
  return parsed.strategies;
}
