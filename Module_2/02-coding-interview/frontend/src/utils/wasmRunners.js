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

  // Track all handles so we can dispose them properly
  const handles = [];

  // Helper to convert QuickJS handles to JS values for logging
  const dumpArgs = (args) => args.map((handle) => {
    try {
      return vm.dump(handle);
    } catch {
      return '[unable to serialize]';
    }
  });

  // Expose a minimal "console" into the VM.
  const consoleHandle = vm.newObject();
  handles.push(consoleHandle);

  const logFn = vm.newFunction('log', (...args) => push('', ...dumpArgs(args)));
  const infoFn = vm.newFunction('info', (...args) => push('INFO: ', ...dumpArgs(args)));
  const warnFn = vm.newFunction('warn', (...args) => push('WARN: ', ...dumpArgs(args)));
  const errorFn = vm.newFunction('error', (...args) => push('ERROR: ', ...dumpArgs(args)));
  handles.push(logFn, infoFn, warnFn, errorFn);

  vm.setProp(consoleHandle, 'log', logFn);
  vm.setProp(consoleHandle, 'info', infoFn);
  vm.setProp(consoleHandle, 'warn', warnFn);
  vm.setProp(consoleHandle, 'error', errorFn);
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
      // Handle both string and object errors, with fallback for cyclic objects
      let errorStr;
      if (typeof err === 'string') {
        errorStr = err;
      } else if (err?.message) {
        errorStr = err.message;
      } else if (err?.name && err?.stack) {
        errorStr = `${err.name}: ${err.stack}`;
      } else {
        try {
          errorStr = JSON.stringify(err);
        } catch {
          errorStr = 'An error occurred during code execution';
        }
      }
      return { output: logs.join('\n'), error: errorStr };
    }
    result.value?.dispose?.();
    return { output: logs.join('\n'), error: null };
  } finally {
    clearTimeout(t);
    // Dispose all handles in reverse order
    for (let i = handles.length - 1; i >= 0; i--) {
      handles[i].dispose();
    }
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

  // Pyodide doesn't support a timeout option directly on runPythonAsync.
  // We use Promise.race with a timeout as a simple guard (note: this won't
  // interrupt infinite loops, but will fail fast for long-running async code).
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  try {
    await Promise.race([pyodide.runPythonAsync(code), timeoutPromise]);
    return { output: lines.filter(Boolean).join('\n'), error: null };
  } catch (e) {
    return { output: lines.filter(Boolean).join('\n'), error: e?.message ? String(e.message) : String(e) };
  }
}

