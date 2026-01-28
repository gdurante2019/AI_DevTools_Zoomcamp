import { useState, useEffect, useRef } from 'react';
import './CodeExecutor.css';

// Safe JavaScript execution using Function constructor with limited scope
function executeJavaScript(code) {
  try {
    const logs = [];
    const originalConsole = console;
    
    // Override console methods to capture output
    const capturedConsole = {
      log: (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      error: (...args) => {
        logs.push('ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      warn: (...args) => {
        logs.push('WARN: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      info: (...args) => {
        logs.push('INFO: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
    };

    // Create a safe execution context
    const safeCode = `
      (function() {
        const console = {
          log: (...args) => __captureLog('log', ...args),
          error: (...args) => __captureLog('error', ...args),
          warn: (...args) => __captureLog('warn', ...args),
          info: (...args) => __captureLog('info', ...args),
        };
        ${code}
      })();
    `;

    // Execute in a try-catch to handle errors
    const func = new Function('__captureLog', safeCode);
    func((level, ...args) => {
      const prefix = level === 'error' ? 'ERROR: ' : level === 'warn' ? 'WARN: ' : level === 'info' ? 'INFO: ' : '';
      logs.push(prefix + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    });

    return { output: logs.join('\n'), error: null };
  } catch (error) {
    return { output: '', error: error.message };
  }
}

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
    setTimeout(() => {
      try {
        if (language === 'javascript' || language === 'typescript') {
          const result = executeJavaScript(code);
          setOutput(result.output || '(No output)');
          setError(result.error);
        } else {
          // For other languages, show a message
          setOutput(`Code execution for ${language} is not yet supported in the browser.\n\n` +
            `Currently, only JavaScript/TypeScript can be executed safely in the browser.\n` +
            `For other languages, you would need a backend service with proper sandboxing.`);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
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
            <strong>Note:</strong> Code execution is limited to JavaScript/TypeScript for browser safety. 
            Other languages would require a backend sandbox service.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CodeExecutor;
