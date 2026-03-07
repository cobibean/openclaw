import { watch, type FSWatcher } from "node:fs";
import { resolve } from "node:path";
import { resolvePipelineDir } from "../connectors/pipeline.js";

export interface BacktestWatcherConfig {
  outputDir?: string;
}

type NewFileCallback = (filePath: string) => Promise<void>;

/**
 * Watch for new backtest output files.
 * Uses native fs.watch (inotify on Linux, FSEvents on macOS).
 */
export function createBacktestWatcher(config?: BacktestWatcherConfig): {
  start: (callback: NewFileCallback) => void;
  stop: () => void;
} {
  const dir = config?.outputDir ?? resolve(resolvePipelineDir(), "backtester/output");
  let watcher: FSWatcher | null = null;
  const seen = new Set<string>();

  return {
    start(callback: NewFileCallback) {
      watcher = watch(dir, (eventType, filename) => {
        if (
          eventType === "rename" &&
          filename &&
          filename.endsWith(".json") &&
          !seen.has(filename)
        ) {
          seen.add(filename);
          const fullPath = resolve(dir, filename);
          // Small delay to ensure file is fully written.
          setTimeout(() => {
            void callback(fullPath);
          }, 1000);
        }
      });
    },
    stop() {
      watcher?.close();
      watcher = null;
    },
  };
}
