const SCI_URL = 'https://cdn.jsdelivr.net/npm/@borkdude/sci@0.5.45/dist/sci.js';
let sciScriptPromise = null;

function ensureSciScript() {
  if (window.sci || window.Sci || window.scittle) return Promise.resolve();
  if (sciScriptPromise) return sciScriptPromise;

  sciScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCI_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load SCI script'));
    document.head.appendChild(script);
  });

  return sciScriptPromise;
}

function getSciApi() {
  if (window.sci && window.sci.core && window.sci.core.evalString) return window.sci;
  if (window.Sci && window.Sci.core && window.Sci.core.evalString) return window.Sci;
  if (window.scittle && window.scittle.eval_string) return window.scittle;
  return null;
}

export function createClojureRunner({ onStdout, onStderr, onSystem }) {
  async function load() {
    await ensureSciScript();
    const api = getSciApi();
    if (!api) throw new Error('SCI runtime not available');
    onSystem('Clojure runtime ready.');
  }

  async function run(code) {
    const api = getSciApi();
    if (!api) throw new Error('SCI runtime not available');

    try {
      if (api.core && api.core.evalString) {
        const result = api.core.evalString(code);
        if (result !== undefined) onStdout(String(result));
        return;
      }
      if (api.eval_string) {
        const result = api.eval_string(code);
        if (result !== undefined) onStdout(String(result));
        return;
      }
      throw new Error('SCI eval API not found');
    } catch (err) {
      onStderr(String(err));
    }
  }

  return {
    load,
    run,
    isReady: () => !!getSciApi()
  };
}
