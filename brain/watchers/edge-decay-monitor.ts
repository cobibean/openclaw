/**
 * Edge Decay Monitor (Phase 1+)
 *
 * Planned functionality:
 * - Compare edge in recent windows vs historical windows
 * - Alert when OOS edge drops below threshold for N consecutive days
 * - Track rolling hit rate vs break-even
 *
 * Not implemented until live/shadow trading data is available.
 */

export interface EdgeDecayConfig {
  decayThresholdPct: number;
  windowDays: number;
  strategies: string[];
}

// Placeholder export
export function createEdgeDecayMonitor(_config: EdgeDecayConfig) {
  return {
    start() {
      // Phase 1+ implementation
    },
    stop() {
      // Phase 1+ implementation
    },
  };
}
