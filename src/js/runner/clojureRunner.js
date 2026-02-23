const SCI_URL = 'vendor/scittle/scittle.js';
let sciScriptPromise = null;

function ensureSciScript() {
  if (window.scittle && window.scittle.eval_string) return Promise.resolve();
  if (window.scittle && window.scittle.core && window.scittle.core.eval_string) return Promise.resolve();
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
  if (window.scittle && window.scittle.eval_string) return window.scittle;
  if (window.scittle && window.scittle.core && window.scittle.core.eval_string) {
    return { eval_string: window.scittle.core.eval_string };
  }
  return null;
}

export function createClojureRunner({ onStdout, onStderr, onSystem }) {
  async function load() {
    await ensureSciScript();
    const api = getSciApi();
    if (!api) throw new Error('Clojure runtime not available');
    onSystem('Clojure runtime ready.');
  }

  async function run(code) {
    const api = getSciApi();
    if (!api) throw new Error('Clojure runtime not available');

    try {
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
