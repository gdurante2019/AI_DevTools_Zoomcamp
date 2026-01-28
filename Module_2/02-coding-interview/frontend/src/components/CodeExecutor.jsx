import { useState, useEffect, useRef } from 'react';
import './CodeExecutor.css';
import { runJavaScriptWasm, runPythonWasm } from '../utils/wasmRunners';

function CodeExecutor({ code, language }) {
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCode = () => {
    if (!code || code.trim() === '') {
      setOutput('No code to execute.');
      setError(null);
      return;
    }

    setIsExecuting(true);
    setError(null);
    setOutput('Executing...\n');

    // Use setTimeout to allow UI to update
    setTimeout(async () => {
      try {
        if (language === 'javascript' || language === 'typescript') {
          const result = await runJavaScriptWasm(code, { timeoutMs: 2000 });
          setOutput(result.output || '(No output)');
          setError(result.error);
        } else if (language === 'python') {
          const result = await runPythonWasm(code, { timeoutMs: 5000 });
          setOutput(result.output || '(No output)');
          setError(result.error);
        } else {
          setOutput(
            `Code execution for ${language} is not supported in-browser yet.\n\n` +
              `This project executes code using WebAssembly in the browser (no server execution).\n` +
              `Currently supported: JavaScript (via QuickJS WASM) and Python (via Pyodide WASM).`,
          );
          setError(null);
        }
      } catch (err) {
        setError(err?.message ? String(err.message) : String(err));
        setOutput('');
      } finally {
        setIsExecuting(false);
      }
    }, 100);
  };

  const clearOutput = () => {
    setOutput('');
    setError(null);
  };

  return (
    <div className="code-executor">
      <div className="executor-header">
        <h3>Code Output</h3>
        <div className="executor-actions">
          <button 
            onClick={executeCode} 
            disabled={isExecuting}
            className="btn-execute"
          >
            {isExecuting ? 'Running...' : '▶ Run Code'}
          </button>
          <button onClick={clearOutput} className="btn-clear">
            Clear
          </button>
        </div>
      </div>
      <div className="executor-content">
        <div 
          ref={outputRef}
          className={`output-container ${error ? 'error' : ''}`}
        >
          {error ? (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <pre className="output-text">{output || 'Click "Run Code" to execute your code...'}</pre>
          )}
        </div>
        <div className="executor-info">
          <p className="info-text">
            <strong>Note:</strong> Code runs in-browser using WebAssembly (no server execution). Currently supported: JavaScript and Python.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CodeExecutor;
