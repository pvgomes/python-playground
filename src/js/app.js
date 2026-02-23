import { loadFS, saveFS, loadOpenFile, saveOpenFile } from './fs.js';
import { consoleClear, consoleLog, consoleError, consoleSystem } from './console.js';
import { createEditor, getEditorValue, setEditorValue, setEditorVisible } from './editor.js';
import { buildTree } from './ui/fileTree.js';
import { initModal, showModal } from './ui/modal.js';
import { createPyodideRunner } from './runner/pyodideRunner.js';

const LS_FONT_SIZE = 'pyplay_fontsize';
const MIN_EDITOR_WIDTH = 300;

let fs = {};
let openFile = null;
let cmEditor = null;
let runner = null;
const folderOpen = {};

function openFileInEditor(path, opts = {}) {
  if (opts.rebuildOnly) {
    rebuildTree();
    return;
  }

  if (!fs[path] || fs[path].type !== 'file') return;

  if (openFile && fs[openFile]) {
    fs[openFile].content = getEditorValue(cmEditor);
  }

  openFile = path;
  saveOpenFile(openFile);

  const noMsg = document.getElementById('no-file-msg');
  if (noMsg) noMsg.style.display = 'none';

  setEditorValue(cmEditor, fs[path].content || '', true);
  setEditorVisible(cmEditor, true);

  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = path.split('/').map((seg, i, arr) =>
    i === arr.length - 1 ? `<span>${seg}</span>` : seg
  ).join(' / ');

  rebuildTree();
}

function rebuildTree() {
  const container = document.getElementById('file-tree');
  buildTree({
    fs,
    openFile,
    folderOpen,
    container,
    onOpenFile: openFileInEditor,
    onDeleteItem: deleteItem
  });
}

function deleteItem(path) {
  const isFolder = fs[path] && fs[path].type === 'folder';
  const msg = isFolder
    ? `Delete folder "${path}" and all its contents?`
    : `Delete file "${path}"?`;
  if (!confirm(msg)) return;

  for (const key of Object.keys(fs)) {
    if (key === path || key.startsWith(path + '/')) {
      delete fs[key];
    }
  }

  if (openFile && (openFile === path || openFile.startsWith(path + '/'))) {
    openFile = null;
    saveOpenFile(openFile);
    setEditorValue(cmEditor, '', true);
    setEditorVisible(cmEditor, false);
    document.getElementById('no-file-msg').style.display = '';
    document.getElementById('breadcrumb').textContent = 'No file open';
  }

  saveFS(fs);
  rebuildTree();
}

function createItem({ name, type, parentPath }) {
  let finalName = name;
  if (type === 'file' && !finalName.split('/').pop().includes('.')) {
    finalName += '.py';
  }

  const path = parentPath ? parentPath + '/' + finalName : finalName;

  if (fs[path]) {
    alert(`"${path}" already exists.`);
    return;
  }

  if (type === 'file') {
    fs[path] = { type: 'file', content: '' };
    saveFS(fs);
    rebuildTree();
    openFileInEditor(path);
  } else {
    fs[path] = { type: 'folder', content: null };
    folderOpen[path] = true;
    saveFS(fs);
    rebuildTree();
  }
}

async function runCode() {
  if (!runner) return;

  if (openFile && fs[openFile]) {
    fs[openFile].content = getEditorValue(cmEditor);
    saveFS(fs);
  }

  const code = getEditorValue(cmEditor);
  consoleClear();

  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Running…';

  try {
    if (!runner.isReady()) {
      consoleSystem('Loading Python runtime...');
      await runner.load();
    }
    await runner.run(code);
  } catch (err) {
    consoleError(String(err));
  } finally {
    btn.disabled = false;
    btn.textContent = '▶ Run';
  }
}

function applyFontSize(size) {
  const clamped = Math.max(10, Math.min(28, size));
  document.documentElement.style.setProperty('--font-size', clamped + 'px');
  document.getElementById('font-size-label').textContent = clamped + 'px';
  if (cmEditor && cmEditor.textarea) {
    cmEditor.textarea.style.fontSize = 'var(--font-size)';
  }
  localStorage.setItem(LS_FONT_SIZE, clamped);
  return clamped;
}

function initConsoleResizer() {
  const resizer = document.getElementById('console-resizer');
  const rightPane = document.getElementById('right-pane');
  const main = document.getElementById('main');
  let dragging = false;

  resizer.addEventListener('mousedown', e => {
    dragging = true;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = main.getBoundingClientRect();
    const newWidth = rect.right - e.clientX;
    const minWidth = 150;
    const maxWidth = rect.width - MIN_EDITOR_WIDTH;
    rightPane.style.width = Math.max(minWidth, Math.min(maxWidth, newWidth)) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

async function boot() {
  try {
    fs = loadFS();
    cmEditor = createEditor(document.getElementById('editor-wrapper'));
    setEditorVisible(cmEditor, false);

    cmEditor.textarea.addEventListener('input', () => {
    if (openFile && fs[openFile]) {
      fs[openFile].content = getEditorValue(cmEditor);
      saveFS(fs);
    }
  });

  rebuildTree();

  if (!fs['main.py']) {
    fs['main.py'] = { type: 'file', content: 'print("hello world")' };
    saveFS(fs);
  }

  const last = loadOpenFile();
  if (last && fs[last] && fs[last].type === 'file') {
    openFileInEditor(last);
  } else if (fs['main.py']) {
    openFileInEditor('main.py');
  }

  document.getElementById('run-btn').addEventListener('click', runCode);
  document.getElementById('add-btn').addEventListener('click', () => showModal(null));
  initModal({ onCreate: createItem });

  const savedSize = parseInt(localStorage.getItem(LS_FONT_SIZE), 10);
  let currentFontSize = applyFontSize(savedSize > 0 ? savedSize : 14);
  document.getElementById('font-increase')
    .addEventListener('click', () => { currentFontSize = applyFontSize(currentFontSize + 1); });
  document.getElementById('font-decrease')
    .addEventListener('click', () => { currentFontSize = applyFontSize(currentFontSize - 1); });

  initConsoleResizer();

  runner = createPyodideRunner({
    onStdout: consoleLog,
    onStderr: consoleError,
    onSystem: consoleSystem
  });

    document.getElementById('run-btn').disabled = false;
    const banner = document.getElementById('boot-banner');
    if (banner) banner.remove();
  } catch (err) {
    consoleError('Boot failed: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', boot);
