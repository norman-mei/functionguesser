import { useRef } from 'react';
import { MathJax } from 'better-react-mathjax';
import Input from './ui/Input';
import Button from './ui/Button';

interface MathInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  showPreview?: boolean;
}

const keypad = [
  { label: '\\pi', insert: '\\pi' },
  { label: 'sin', insert: '\\sin(x)' },
  { label: 'cos', insert: '\\cos(x)' },
  { label: 'tan', insert: '\\tan(x)' },
  { label: 'exp', insert: 'e^{x}' },
  { label: 'ln', insert: '\\ln(x)' },
  { label: 'abs', insert: '\\left|x\\right|' },
  { label: 'sqrt', insert: '\\sqrt{x}' },
  { label: '^', insert: '^{2}' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '*', insert: '\\cdot ' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' }
];

const MathInput = ({ value, onChange, placeholder, showPreview = true }: MathInputProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);

    window.requestAnimationFrame(() => {
      const caret = start + token.length;
      input.focus();
      input.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />

      {showPreview && (
        <div className="rounded-md border border-[var(--border)] bg-[var(--panel-soft)] p-2">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Preview</p>
          <div className="min-h-[40px] text-base text-[var(--text)]">
            <MathJax dynamic inline>
              {value ? `\\( ${value} \\)` : '\\( \\)'}
            </MathJax>
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--panel-soft)] p-2">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Math keypad</p>
        <div className="flex flex-wrap gap-2">
          {keypad.map((key) => (
            <Button
              key={key.label}
              variant="ghost"
              className="border border-slate-800 px-2 py-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                insertToken(key.insert);
              }}
            >
              {key.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MathInput;
