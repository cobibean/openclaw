import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface PipelineResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Resolve the pipeline/ directory relative to polly/.
 * From polly/brain/connectors/ -> ../../pipeline/
 */
export function resolvePipelineDir(): string {
  // Handle both source (`polly/brain/...`) and built (`polly/dist/brain/...`) paths.
  const here = dirname(fileURLToPath(import.meta.url));
  const candidatePollyRoots = [resolve(here, "../../.."), resolve(here, "../..")];

  for (const pollyRoot of candidatePollyRoots) {
    const pipelineDir = resolve(pollyRoot, "../pipeline");
    if (existsSync(pipelineDir)) {
      return pipelineDir;
    }
  }

  // Fallback to the built-layout assumption.
  return resolve(resolve(here, "../../.."), "../pipeline");
}

/**
 * Run a Python module command in the pipeline directory.
 * @param module - Python module to run (e.g., "backtester", "analyzer")
 * @param args - CLI arguments
 * @param options - Optional overrides
 */
export async function runPipelineCommand(
  module: string,
  args: string[] = [],
  options?: { cwd?: string; timeout?: number },
): Promise<PipelineResult> {
  const cwd = options?.cwd ?? resolvePipelineDir();
  const timeout = options?.timeout ?? 120_000;

  return new Promise((resolveResult) => {
    execFile(
      "python3",
      ["-m", module, ...args],
      { cwd, timeout, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        resolveResult({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode: error?.code ? Number(error.code) : error ? 1 : 0,
        });
      },
    );
  });
}
