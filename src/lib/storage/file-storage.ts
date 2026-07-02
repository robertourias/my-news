import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Briefing } from "../types";
import type { StorageProvider } from "./storage";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
const BRIEFINGS_DIR = path.join(DATA_DIR, "briefings");
const LATEST = path.join(DATA_DIR, "latest.json");

async function readJson(file: string): Promise<Briefing | null> {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as Briefing;
  } catch {
    return null;
  }
}

/** Escrita atômica: escreve em .tmp e renomeia. */
async function writeJson(file: string, data: unknown): Promise<void> {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data), "utf-8");
  await rename(tmp, file);
}

export class FileStorage implements StorageProvider {
  async getLatest(): Promise<Briefing | null> {
    return readJson(LATEST);
  }

  async getByDate(date: string): Promise<Briefing | null> {
    return readJson(path.join(BRIEFINGS_DIR, `${date}.json`));
  }

  async save(briefing: Briefing): Promise<void> {
    await mkdir(BRIEFINGS_DIR, { recursive: true });
    await writeJson(path.join(BRIEFINGS_DIR, `${briefing.date}.json`), briefing);
    await writeJson(LATEST, briefing);
  }
}
