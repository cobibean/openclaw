import Database from "better-sqlite3";
import { resolve } from "node:path";
import { resolvePipelineDir } from "./pipeline.js";

function getDb(dbPath?: string): Database.Database {
  const path = dbPath ?? resolve(resolvePipelineDir(), "data/polymarket.db");
  return new Database(path, { readonly: true, fileMustExist: true });
}

export function getWindowCount(dbPath?: string): number {
  const db = getDb(dbPath);
  try {
    const row = db.prepare("SELECT COUNT(*) as cnt FROM windows_15m").get() as { cnt: number };
    return row.cnt;
  } finally {
    db.close();
  }
}

export function getDateRange(dbPath?: string): { start: string; end: string } {
  const db = getDb(dbPath);
  try {
    const row = db
      .prepare("SELECT MIN(window_start) as start_dt, MAX(window_start) as end_dt FROM windows_15m")
      .get() as { start_dt: string; end_dt: string };
    return { start: row.start_dt, end: row.end_dt };
  } finally {
    db.close();
  }
}

export function getSnapshotCount(dbPath?: string): number {
  const db = getDb(dbPath);
  try {
    const row = db.prepare("SELECT COUNT(*) as cnt FROM snapshots").get() as { cnt: number };
    return row.cnt;
  } finally {
    db.close();
  }
}

export function getMarketCount(dbPath?: string): number {
  const db = getDb(dbPath);
  try {
    const row = db.prepare("SELECT COUNT(*) as cnt FROM markets").get() as { cnt: number };
    return row.cnt;
  } finally {
    db.close();
  }
}
