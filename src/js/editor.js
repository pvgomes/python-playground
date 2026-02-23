export function createEditor(wrapper) {
  const textarea = document.createElement('textarea');
  textarea.spellcheck = false;
  textarea.wrap = 'off';
  textarea.style.width = '100%';
  textarea.style.height = '100%';
  textarea.style.background = 'transparent';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.color = 'inherit';
  textarea.style.font = 'inherit';
  textarea.style.fontSize = 'var(--font-size)';
  textarea.style.lineHeight = '1.6';
  textarea.style.padding = '12px';
  wrapper.appendChild(textarea);

  return { textarea };
}

export function setEditorValue(editor, value, clearHistory = true) {
  editor.textarea.value = value || '';
  if (clearHistory) {
    editor.textarea.scrollTop = 0;
  }
}

export function setEditorVisible(editor, visible) {
  editor.textarea.style.display = visible ? '' : 'none';
}

export function getEditorValue(editor) {
  return editor.textarea.value;
}
