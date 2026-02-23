let modalType = 'file';
let newItemParent = null;
let onCreateCallback = null;

export function initModal({ onCreate }) {
  onCreateCallback = onCreate;

  document.getElementById('modal-cancel').addEventListener('click', hideModal);
  document.getElementById('modal-create').addEventListener('click', createItem);
  document.getElementById('type-file').addEventListener('click', () => selectType('file'));
  document.getElementById('type-folder').addEventListener('click', () => selectType('folder'));
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });
  document.getElementById('modal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') createItem();
    if (e.key === 'Escape') hideModal();
  });
}

export function showModal(parentPath) {
  newItemParent = parentPath || null;
  modalType = 'file';
  document.getElementById('type-file').classList.add('selected');
  document.getElementById('type-folder').classList.remove('selected');
  document.getElementById('modal-input').value = '';
  document.getElementById('modal-overlay').classList.add('visible');
  setTimeout(() => document.getElementById('modal-input').focus(), 50);
}

function hideModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
}

function selectType(t) {
  modalType = t;
  document.getElementById('type-file').classList.toggle('selected', t === 'file');
  document.getElementById('type-folder').classList.toggle('selected', t === 'folder');
  document.getElementById('modal-input').placeholder =
    t === 'file' ? 'e.g. main.py' : 'e.g. src';
}

function createItem() {
  const input = document.getElementById('modal-input');
  let name = input.value.trim();
  if (!name) return;

  onCreateCallback({
    name,
    type: modalType,
    parentPath: newItemParent
  });

  hideModal();
}
