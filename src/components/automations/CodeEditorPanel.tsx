import { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { autocompletion } from '@codemirror/autocomplete';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Copy, Trash2, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';

type Language = 'python' | 'javascript' | 'shell' | 'json';

const LANGUAGE_OPTIONS: { value: Language; label: string; ext: string }[] = [
  { value: 'python', label: 'Python', ext: '.py' },
  { value: 'javascript', label: 'JavaScript', ext: '.js' },
  { value: 'shell', label: 'Shell / Bash', ext: '.sh' },
  { value: 'json', label: 'JSON', ext: '.json' },
];

const TEMPLATES: Record<Language, string> = {
  python: `# Acesse inputs via variável 'inputs'
# Retorne o resultado via 'output'

import json

data = inputs.get("data", {})
result = {"status": "ok", "processed": True}

output = json.dumps(result)
`,
  javascript: `// Acesse inputs via variável 'inputs'
// Retorne o resultado via 'output'

const data = inputs.data || {};
const result = { status: "ok", processed: true };

output = JSON.stringify(result);
`,
  shell: `#!/bin/bash
# Acesse inputs via variáveis de ambiente
# stdout será capturado como output

echo "Executando script..."
echo '{"status": "ok"}'
`,
  json: `{
  "transform": "jq",
  "expression": ".data | map(select(.active == true))",
  "input": "{{previous_node.output}}"
}
`,
};

function getExtensions(lang: Language) {
  const base = [autocompletion()];
  switch (lang) {
    case 'python':
      return [...base, python()];
    case 'javascript':
      return [...base, javascript()];
    case 'json':
      return [...base, json()];
    case 'shell':
      return base; // no specific shell lang extension
    default:
      return base;
  }
}

interface CodeEditorPanelProps {
  code: string;
  language: Language;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: Language) => void;
}

export function CodeEditorPanel({ code, language, onCodeChange, onLanguageChange }: CodeEditorPanelProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = useCallback((lang: Language) => {
    onLanguageChange(lang);
    if (!code || code.trim() === '' || code === TEMPLATES[language]) {
      onCodeChange(TEMPLATES[lang]);
    }
  }, [code, language, onCodeChange, onLanguageChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  }, [code]);

  const handleClear = useCallback(() => {
    onCodeChange('');
  }, [onCodeChange]);

  const handleInsertTemplate = useCallback(() => {
    onCodeChange(TEMPLATES[language]);
    toast.success('Template inserido');
  }, [language, onCodeChange]);

  const handleTestRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      toast.info('Execução de teste simulada — conecte ao backend para execução real');
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map(l => (
                <SelectItem key={l.value} value={l.value}>
                  <span className="flex items-center gap-1.5">
                    <FileCode2 className="h-3 w-3" />
                    {l.label}
                    <span className="text-muted-foreground">{l.ext}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleInsertTemplate}>
          <FileCode2 className="h-3 w-3" />
          Template
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleCopy}>
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleClear}>
          <Trash2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={handleTestRun}
          disabled={isRunning || !code.trim()}
        >
          <Play className="h-3 w-3" />
          {isRunning ? 'Executando...' : 'Testar'}
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border">
        <CodeMirror
          value={code}
          onChange={onCodeChange}
          theme={vscodeDark}
          extensions={getExtensions(language)}
          height="100%"
          className="text-sm [&_.cm-editor]:!outline-none [&_.cm-gutters]:!border-r-border/30"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            indentOnInput: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Footer hint */}
      <p className="text-[10px] text-muted-foreground leading-tight">
        Use <code className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">{'{{node_id.output.field}}'}</code> para referenciar outputs de outros nós.
      </p>
    </div>
  );
}
