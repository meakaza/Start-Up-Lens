import type {
  ActionItemEntry,
  AuditSession,
  DosenAccount,
  GradingSchemeConfig,
} from '../types/audit';

export const STORAGE_SESSIONS_KEY = 'cafelab_audit_sessions_v2';
export const STORAGE_ACTIONS_KEY = 'cafelab_audit_actions_v2';
export const STORAGE_SCHEME_KEY = 'cafelab_grading_scheme_v1';
export const STORAGE_DOSEN_KEY = 'cafelab_dosen_account_v1';

const DB_NAME = 'startup_lens_audit_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB tidak tersedia pada browser ini.'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Gagal membuka IndexedDB.'));
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T | null): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = value === null ? store.delete(key) : store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch {
    return false;
  }
}

export function readLocalStorageJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeLocalStorageJson<T>(key: string, value: T | null): boolean {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
}

export async function savePersistedKey<T>(
  key: string,
  value: T | null
): Promise<{ saved: boolean; storage: 'indexeddb+local' | 'indexeddb' | 'local' | 'none' }> {
  const localOk = writeLocalStorageJson(key, value);
  const idbOk = await idbSet(key, value);

  if (idbOk && localOk) return { saved: true, storage: 'indexeddb+local' };
  if (idbOk) return { saved: true, storage: 'indexeddb' };
  if (localOk) return { saved: true, storage: 'local' };
  return { saved: false, storage: 'none' };
}

export async function loadAllPersistedState(): Promise<{
  sessions: AuditSession[] | null;
  actionItems: ActionItemEntry[] | null;
  gradingScheme: GradingSchemeConfig | null;
  dosenAccount: DosenAccount | null;
}> {
  const [sessions, actionItems, gradingScheme, dosenAccount] = await Promise.all([
    idbGet<AuditSession[]>(STORAGE_SESSIONS_KEY),
    idbGet<ActionItemEntry[]>(STORAGE_ACTIONS_KEY),
    idbGet<GradingSchemeConfig>(STORAGE_SCHEME_KEY),
    idbGet<DosenAccount>(STORAGE_DOSEN_KEY),
  ]);

  return {
    sessions:
      Array.isArray(sessions) && sessions.length > 0
        ? sessions
        : readLocalStorageJson<AuditSession[]>(STORAGE_SESSIONS_KEY),
    actionItems:
      Array.isArray(actionItems)
        ? actionItems
        : readLocalStorageJson<ActionItemEntry[]>(STORAGE_ACTIONS_KEY),
    gradingScheme:
      gradingScheme ?? readLocalStorageJson<GradingSchemeConfig>(STORAGE_SCHEME_KEY),
    dosenAccount:
      dosenAccount ?? readLocalStorageJson<DosenAccount>(STORAGE_DOSEN_KEY),
  };
}
