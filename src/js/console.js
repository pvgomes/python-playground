export function consoleClear() {
  document.getElementById('console-output').innerHTML = '';
}

export function consoleAppend(text, cls) {
  const out = document.getElementById('console-output');
  const span = document.createElement('span');
  span.className = cls;
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
}

export function consoleLog(text)    { consoleAppend(text + '\n', 'out-stdout'); }
export function consoleError(text)  { consoleAppend(text + '\n', 'out-stderr'); }
export function consoleSystem(text) { consoleAppend(text + '\n', 'out-system'); }
