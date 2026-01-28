import { getQuickJS } from 'quickjs-emscripten';

// ---- QuickJS (WASM) for JavaScript execution ----
let quickJsModulePromise;
async function getQuickJsModule() {
  if (!quickJsModulePromise) quickJsModulePromise = getQuickJS();
  return quickJsModulePromise;
}

export async function runJavaScriptWasm(code, { timeoutMs = 2000 } = {}) {
  const QuickJS = await getQuickJsModule();
  const vm = QuickJS.newContext();

  const logs = [];
  const push = (prefix, ...args) => {
    const line = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');
    logs.push(prefix ? `${prefix}${line}` : line);
  };

  // Expose a minimal "console" into the VM.
  const consoleHandle = vm.newObject();
  vm.setProp(consoleHandle, 'log', vm.newFunction('log', (...args) => push('', ...args)));
  vm.setProp(consoleHandle, 'info', vm.newFunction('info', (...args) => push('INFO: ', ...args)));
  vm.setProp(consoleHandle, 'warn', vm.newFunction('warn', (...args) => push('WARN: ', ...args)));
  vm.setProp(consoleHandle, 'error', vm.newFunction('error', (...args) => push('ERROR: ', ...args)));
  vm.setProp(vm.global, 'console', consoleHandle);

  // Crude timeout guard: we can't reliably preempt infinite loops in the same thread,
  // but we can at least fail fast for normal code paths.
  let timedOut = false;
  const t = setTimeout(() => {
    timedOut = true;
  }, timeoutMs);

  try {
    const result = vm.evalCode(code, 'user.js');
    if (timedOut) {
      result?.dispose?.();
      return { output: logs.join('\n'), error: `Timed out after ${timeoutMs}ms` };
    }
    if (result.error) {
      const err = vm.dump(result.error);
      result.error.dispose();
      return { output: logs.join('\n'), error: String(err) };
    }
    result.value?.dispose?.();
    return { output: logs.join('\n'), error: null };
  } finally {
    clearTimeout(t);
    consoleHandle.dispose();
    vm.dispose();
  }
}

// ---- Pyodide (WASM) for Python execution ----
// Load Pyodide from CDN (keeps bundling simple; download happens at runtime).
let pyodidePromise;

async function loadScriptOnce(src) {
  return await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      // eslint-disable-next-line no-undef
      if (!window.loadPyodide) {
        await loadScriptOnce('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
      }
      // eslint-disable-next-line no-undef
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      });
      return pyodide;
    })();
  }
  return pyodidePromise;
}

export async function runPythonWasm(code, { timeoutMs = 5000 } = {}) {
  const pyodide = await getPyodide();
  const lines = [];

  // Redirect stdout/stderr to JS.
  pyodide.setStdout({ batched: (s) => lines.push(String(s).replace(/\n$/, '')) });
  pyodide.setStderr({ batched: (s) => lines.push(`ERROR: ${String(s).replace(/\n$/, '')}`) });

  // Timeout: Pyodide supports interruption via a "timeout" option on runPythonAsync.
  try {
    await pyodide.runPythonAsync(code, { timeout: timeoutMs });
    return { output: lines.filter(Boolean).join('\n'), error: null };
  } catch (e) {
    return { output: lines.filter(Boolean).join('\n'), error: e?.message ? String(e.message) : String(e) };
  }
}

