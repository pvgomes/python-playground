import { buildTreeData } from '../fs.js';

export function buildTree({ fs, openFile, folderOpen, container, onOpenFile, onDeleteItem }) {
  container.innerHTML = '';
  const tree = buildTreeData(fs);
  renderTreeLevel(container, tree, 0, { openFile, folderOpen, onOpenFile, onDeleteItem });
}

function renderTreeLevel(container, node, depth, ctx) {
  const keys = Object.keys(node).sort((a, b) => {
    const aDir = node[a].__isFolder;
    const bDir = node[b].__isFolder;
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.localeCompare(b);
  });

  for (const key of keys) {
    const item = node[key];
    if (item.__isFile) {
      renderFileItem(container, key, item.__path, depth, ctx);
    } else if (item.__isFolder) {
      renderFolderItem(container, key, item.__path, item.__children, depth, ctx);
    }
  }
}

function renderFileItem(container, name, path, depth, ctx) {
  const div = document.createElement('div');
  div.className = 'tree-item' + (ctx.openFile === path ? ' active' : '');
  div.style.paddingLeft = (8 + depth * 16) + 'px';
  div.dataset.path = path;

  const icon = document.createElement('span');
  icon.className = 'item-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '📄';

  const label = document.createElement('span');
  label.className = 'item-name';
  label.textContent = name;

  const del = document.createElement('button');
  del.className = 'delete-btn';
  del.textContent = '×';
  del.title = 'Delete file';
  del.addEventListener('click', e => { e.stopPropagation(); ctx.onDeleteItem(path); });

  div.append(icon, label, del);
  div.addEventListener('click', () => ctx.onOpenFile(path));
  container.appendChild(div);
}

function renderFolderItem(container, name, path, children, depth, ctx) {
  const isOpen = ctx.folderOpen[path] !== false;

  const div = document.createElement('div');
  div.className = 'tree-item';
  div.style.paddingLeft = (8 + depth * 16) + 'px';
  div.dataset.path = path;

  const icon = document.createElement('span');
  icon.className = 'item-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = isOpen ? '📂' : '📁';

  const label = document.createElement('span');
  label.className = 'item-name';
  label.textContent = name;

  const del = document.createElement('button');
  del.className = 'delete-btn';
  del.textContent = '×';
  del.title = 'Delete folder';
  del.addEventListener('click', e => { e.stopPropagation(); ctx.onDeleteItem(path); });

  div.setAttribute('aria-expanded', String(isOpen));
  div.append(icon, label, del);
  div.addEventListener('click', e => {
    if (e.target === del) return;
    ctx.folderOpen[path] = !isOpen;
    ctx.onOpenFile(null, { rebuildOnly: true });
  });
  container.appendChild(div);

  if (isOpen) {
    const childContainer = document.createElement('div');
    renderTreeLevel(childContainer, children, depth + 1, ctx);
    container.appendChild(childContainer);
  }
}
