export function createJsRunner({ onStdout, onStderr, onSystem }) {
  let worker = null;

  function ensureWorker() {
    if (worker) return;

    const blob = new Blob([
      "self.onmessage = (event) => {\n" +
      "  const { code } = event.data;\n" +
      "  const send = (type, text) => self.postMessage({ type, text });\n" +
      "  try {\n" +
      "    const console = {\n" +
      "      log: (...args) => send('stdout', args.join(' ')),\n" +
      "      error: (...args) => send('stderr', args.join(' '))\n" +
      "    };\n" +
      "    const fn = new Function('console', code);\n" +
      "    const result = fn(console);\n" +
      "    if (result !== undefined) send('stdout', String(result));\n" +
      "  } catch (err) {\n" +
      "    send('stderr', String(err));\n" +
      "  }\n" +
      "};\n"
    ], { type: 'application/javascript' });

    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = event => {
      const { type, text } = event.data || {};
      if (type === 'stdout') onStdout(text);
      else if (type === 'stderr') onStderr(text);
    };
    worker.onerror = err => onStderr(err.message);
  }

  async function load() {
    onSystem('JavaScript runtime ready.');
  }

  async function run(code) {
    ensureWorker();
    worker.postMessage({ code });
  }

  return {
    load,
    run,
    isReady: () => true
  };
}
