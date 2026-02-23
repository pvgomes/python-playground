import { preprocessCode } from '../preprocess.js';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
let pyodideScriptPromise = null;

function ensurePyodideScript() {
  if (window.loadPyodide) return Promise.resolve();
  if (pyodideScriptPromise) return pyodideScriptPromise;

  pyodideScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PYODIDE_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.head.appendChild(script);
  });

  return pyodideScriptPromise;
}

export function createPyodideRunner({ onStdout, onStderr, onSystem }) {
  let pyodide = null;

  async function load() {
    await ensurePyodideScript();
    onSystem('Loading Python runtime...');
    pyodide = await loadPyodide();
    onSystem('Python runtime ready. Click Run to execute your code.');
  }

  async function run(code) {
    if (!pyodide) throw new Error('Pyodide not initialized');

    const processed = preprocessCode(code);

    pyodide.runPython(`
import sys, io
_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf
`);

    try {
      await pyodide.runPythonAsync(processed);
    } catch (err) {
      const stderr = pyodide.runPython('_stderr_buf.getvalue()');
      if (stderr) onStderr(stderr.trimEnd());
      const errStr = String(err);
      if (!stderr || !stderr.includes(errStr.split('\n')[0])) {
        onStderr(errStr);
      }
      restoreStdIo();
      return;
    }

    const stdout = pyodide.runPython('_stdout_buf.getvalue()');
    const stderr = pyodide.runPython('_stderr_buf.getvalue()');

    if (stdout) onStdout(stdout.trimEnd());
    if (stderr) onStderr(stderr.trimEnd());
    if (!stdout && !stderr) onSystem('(no output)');

    restoreStdIo();
  }

  function restoreStdIo() {
    pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
  }

  return {
    load,
    run,
    isReady: () => !!pyodide
  };
}
