import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAnalyzerJson } from "../connectors/analyzer.js";
import { resolvePipelineDir } from "../connectors/pipeline.js";

describe("pipeline connector", () => {
  it("resolves pipeline directory", () => {
    const dir = resolvePipelineDir();
    expect(dir).toContain("pipeline");
  });

  // Integration test (requires pipeline to exist)
  it("pipeline directory exists", () => {
    const dir = resolvePipelineDir();
    expect(existsSync(dir)).toBe(true);
  });

  it("parses analyzer fixture JSON", async () => {
    const fixturePath = fileURLToPath(
      new URL("./fixtures/sample-analyzer-report.json", import.meta.url),
    );
    const results = await parseAnalyzerJson(fixturePath);
    expect(results.length).toBe(3);
    expect(results[0]?.strategy).toBeTypeOf("string");
  });
});
