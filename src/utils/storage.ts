/** Local storage and IndexedDB persistence utilities */

import {
  type BattleRecord,
  DEFAULT_SETTINGS,
  type GameSettings,
} from "../types/storage";

const PROMPT_KEY = "mechArena_battlePrompt";
const SETTINGS_KEY = "mechArena_settings";
const HISTORY_LS_KEY = "mechArena_battleHistory";
const DB_NAME = "mechArenaDB";
const DB_VERSION = 1;
const STORE_NAME = "battleHistory";
const MAX_BATTLES = 100;

// --- Mech Prompt (localStorage) ---

export function saveMechPrompt(prompt: string): void {
  localStorage.setItem(PROMPT_KEY, prompt);
}

export function loadMechPrompt(): string {
  return localStorage.getItem(PROMPT_KEY) ?? "";
}

// --- Game Settings (localStorage) ---

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): GameSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// --- Battle History (IndexedDB with localStorage fallback) ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

// --- IndexedDB implementations ---

async function saveBattleHistoryIDB(record: BattleRecord): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put(record);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadBattleHistoryIDB(): Promise<BattleRecord[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("timestamp");
  const request = index.getAll();
  const records = await new Promise<BattleRecord[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as BattleRecord[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  // Return newest first
  return records.reverse();
}

async function clearOldBattlesIDB(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("timestamp");
  const countReq = store.count();
  const count = await new Promise<number>((resolve, reject) => {
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });

  let deleted = 0;
  if (count > MAX_BATTLES) {
    const toDelete = count - MAX_BATTLES;
    const cursorReq = index.openCursor();
    deleted = await new Promise<number>((resolve, reject) => {
      let removed = 0;
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor && removed < toDelete) {
          cursor.delete();
          removed++;
          cursor.continue();
        } else {
          resolve(removed);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return deleted;
}

// --- localStorage fallback implementations ---

function saveBattleHistoryLS(record: BattleRecord): void {
  const records = loadBattleHistoryLS();
  records.unshift(record);
  // Trim to MAX_BATTLES
  if (records.length > MAX_BATTLES) {
    records.length = MAX_BATTLES;
  }
  localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(records));
}

function loadBattleHistoryLS(): BattleRecord[] {
  const raw = localStorage.getItem(HISTORY_LS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BattleRecord[];
  } catch {
    return [];
  }
}

function clearOldBattlesLS(): number {
  const records = loadBattleHistoryLS();
  if (records.length <= MAX_BATTLES) return 0;
  const deleted = records.length - MAX_BATTLES;
  records.length = MAX_BATTLES;
  localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(records));
  return deleted;
}

// --- Public API (auto-selects IndexedDB or localStorage) ---

export async function saveBattleHistory(record: BattleRecord): Promise<void> {
  if (isIndexedDBAvailable()) {
    try {
      await saveBattleHistoryIDB(record);
      await clearOldBattlesIDB();
      return;
    } catch {
      // Fall through to localStorage
    }
  }
  saveBattleHistoryLS(record);
}

export async function loadBattleHistory(): Promise<BattleRecord[]> {
  if (isIndexedDBAvailable()) {
    try {
      return await loadBattleHistoryIDB();
    } catch {
      // Fall through to localStorage
    }
  }
  return loadBattleHistoryLS();
}

export async function clearOldBattles(): Promise<number> {
  if (isIndexedDBAvailable()) {
    try {
      return await clearOldBattlesIDB();
    } catch {
      // Fall through to localStorage
    }
  }
  return clearOldBattlesLS();
}
