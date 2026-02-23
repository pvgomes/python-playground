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
      // Capture console.log output during execution
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => String(arg)).join(' '));
      };

      try {
        const result = api.eval_string(code);
        
        // Restore console.log before outputting
        console.log = originalLog;
        
        // Output captured logs
        if (logs.length > 0) {
          logs.forEach(log => onStdout(log));
        }
        
        // Also output the result if it's not undefined
        if (result !== undefined && result !== null) {
          onStdout(String(result));
        }
      } finally {
        // Ensure console.log is always restored
        console.log = originalLog;
      }
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
