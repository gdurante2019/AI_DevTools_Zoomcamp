import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
];

const DEFAULT_CODE = {
  javascript: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
console.log("This code runs in a safe sandbox environment.");`,
  python: `# Welcome to the coding interview platform!
# Write your code here and it will execute in real-time.

def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("This code runs in a safe sandbox environment.")`,
  java: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("This code runs in a safe sandbox environment.");
    }
}`,
  cpp: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "This code runs in a safe sandbox environment." << endl;
    return 0;
}`,
  csharp: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        Console.WriteLine("This code runs in a safe sandbox environment.");
    }
}`,
  typescript: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
console.log("This code runs in a safe sandbox environment.");`,
  go: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("This code runs in a safe sandbox environment.")
}`,
  rust: `// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

fn main() {
    println!("Hello, World!");
    println!("This code runs in a safe sandbox environment.");
}`,
  php: `<?php
// Welcome to the coding interview platform!
// Write your code here and it will execute in real-time.

function greet($name) {
    return "Hello, $name!";
}

echo greet("World");
echo "\nThis code runs in a safe sandbox environment.";
?>`,
  ruby: `# Welcome to the coding interview platform!
# Write your code here and it will execute in real-time.

def greet(name)
  "Hello, #{name}!"
end

puts greet("World")
puts "This code runs in a safe sandbox environment."`,
};

function CodeEditor({ code, language, onCodeChange, onLanguageChange }) {
  const [localCode, setLocalCode] = useState(code || DEFAULT_CODE[language] || '');
  const [isLocalChange, setIsLocalChange] = useState(false);

  // Sync localCode with prop when code is received from server (external change)
  useEffect(() => {
    if (!isLocalChange && code !== undefined && code !== localCode) {
      setLocalCode(code);
    }
    setIsLocalChange(false);
  }, [code]);

  const handleEditorChange = (value) => {
    const newCode = value || '';
    setLocalCode(newCode);
    setIsLocalChange(true);
    onCodeChange(newCode);
  };

  const handleLanguageSelect = (e) => {
    const newLanguage = e.target.value;
    const defaultCode = DEFAULT_CODE[newLanguage] || '';
    setLocalCode(defaultCode);
    onLanguageChange(newLanguage);
    onCodeChange(defaultCode);
  };

  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="language-selector">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageSelect}
            className="language-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={language}
          value={localCode || code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
