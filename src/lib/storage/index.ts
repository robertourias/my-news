import { FileStorage } from "./file-storage";
import type { StorageProvider } from "./storage";

let instance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!instance) instance = new FileStorage();
  return instance;
}

export type { StorageProvider };
