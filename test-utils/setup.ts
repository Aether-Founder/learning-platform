import '@testing-library/jest-dom/vitest';

// Point the SQLite layer at an in-memory database so tests never touch the
// real data/learning-platform.db file. This must be set before lib/db.ts is
// imported by any test module.
process.env.SQLITE_DB_PATH = ':memory:';

// Deterministic-ish JWT secret for tests (never used in production).
process.env.JWT_SECRET = 'test-secret';

// Minimal localStorage/window mock for modules that gate on `typeof window`.
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
  writable: true,
});
