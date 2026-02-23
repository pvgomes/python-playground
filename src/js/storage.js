export function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (_) {
    return createMemoryStorage();
  }
  return createMemoryStorage();
}

export function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}
