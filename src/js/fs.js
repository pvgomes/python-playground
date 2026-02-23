import { getStorage } from './storage.js';

export const LS_FS = 'pyplay_fs';
export const LS_OPEN = 'pyplay_open';
const MAX_FS_BYTES = 500000;

export function defaultFS() {
  return {
    'main.py': { type: 'file', content: 'print("hello world")' }
  };
}

export function loadFS(storage = getStorage()) {
  const raw = storage.getItem(LS_FS);
  if (raw) {
    if (raw.length > MAX_FS_BYTES) {
      resetFS(storage);
      return defaultFS();
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid fs');
      return parsed;
    } catch (_) {
      resetFS(storage);
      return defaultFS();
    }
  }
  const fs = defaultFS();
  saveFS(fs, storage);
  return fs;
}

export function resetFS(storage = getStorage()) {
  storage.removeItem(LS_FS);
  storage.removeItem(LS_OPEN);
}

export function saveFS(fs, storage = getStorage()) {
  storage.setItem(LS_FS, JSON.stringify(fs));
}

export function loadOpenFile(storage = getStorage()) {
  return storage.getItem(LS_OPEN) || null;
}

export function saveOpenFile(openFile, storage = getStorage()) {
  if (openFile) storage.setItem(LS_OPEN, openFile);
  else storage.removeItem(LS_OPEN);
}

export function buildTreeData(fs) {
  const tree = {};
  const paths = Object.keys(fs).sort((a, b) => {
    const aIsDir = fs[a].type === 'folder';
    const bIsDir = fs[b].type === 'folder';
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.localeCompare(b);
  });

  for (const path of paths) {
    const parts = path.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!node[seg]) node[seg] = { __children: {} };
      node = node[seg].__children;
    }
    const last = parts[parts.length - 1];
    if (fs[path].type === 'folder') {
      if (!node[last]) node[last] = { __children: {} };
      node[last].__isFolder = true;
      node[last].__path = path;
    } else {
      node[last] = { __isFile: true, __path: path };
    }
  }

  return tree;
}
