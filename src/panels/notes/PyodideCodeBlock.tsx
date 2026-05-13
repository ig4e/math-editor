// Renders a `python` fenced code block from Notes with a Run button.
// On click, lazy-loads Pyodide and runs the code with stdout / stderr
// captured. Output renders inline below the source.

import { useState } from 'react';
import { Button } from '../../components/common';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  code: string;
}

interface RunResult {
  status: 'idle' | 'running' | 'ok' | 'error';
  stdout: string;
  stderr: string;
}

const INIT: RunResult = { status: 'idle', stdout: '', stderr: '' };

export function PyodideCodeBlock({ code }: Props) {
  const [result, setResult] = useState<RunResult>(INIT);

  const onRun = async () => {
    setResult({ status: 'running', stdout: '', stderr: '' });
    try {
      const { ensurePyodide } = await import('../../solvers/pyodide/loader');
      const py = await ensurePyodide();
      // Redirect stdout/stderr to StringIO, run user code, read back.
      const wrapped = `
import sys, io, traceback
__stdout, __stderr = io.StringIO(), io.StringIO()
sys.stdout, sys.stderr = __stdout, __stderr
try:
${code.split('\n').map((l) => '    ' + l).join('\n')}
except Exception:
    traceback.print_exc()
sys.stdout, sys.stderr = sys.__stdout__, sys.__stderr__
__stdout.getvalue() + chr(1) + __stderr.getvalue()
`;
      const raw = String(await py.runPythonAsync(wrapped));
      const sep = raw.indexOf('');
      const stdout = sep >= 0 ? raw.slice(0, sep) : raw;
      const stderr = sep >= 0 ? raw.slice(sep + 1) : '';
      setResult({ status: stderr ? 'error' : 'ok', stdout, stderr });
    } catch (err) {
      setResult({ status: 'error', stdout: '', stderr: (err as Error).message });
    }
  };

  return (
    <div className="my-2 rounded-md border border-border bg-surface-2 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border-soft bg-surface">
        <span className="text-[11px] uppercase tracking-wide text-fg-muted font-semibold">python</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRun}
          disabled={result.status === 'running'}
          leadingIcon={<Icon name={result.status === 'running' ? 'refresh' : 'play'} className="w-3.5 h-3.5" />}
        >
          {result.status === 'running' ? 'Running…' : 'Run'}
        </Button>
      </div>
      <pre className="px-3 py-2 font-mono text-[12px] text-fg whitespace-pre overflow-x-auto">
        {code}
      </pre>
      {(result.stdout || result.stderr) && (
        <div className="border-t border-border-soft">
          {result.stdout && (
            <pre className="px-3 py-2 font-mono text-[12px] text-fg-2 whitespace-pre overflow-x-auto bg-surface">
              {result.stdout.trimEnd()}
            </pre>
          )}
          {result.stderr && (
            <pre className={cx(
              'px-3 py-2 font-mono text-[12px] whitespace-pre overflow-x-auto bg-danger/5 text-danger',
            )}>
              {result.stderr.trimEnd()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
