import { useRef } from 'react';
import { MathJax } from 'better-react-mathjax';
import Input from './ui/Input';
import Button from './ui/Button';

interface MathInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  onInteract?: () => void;
}

const keypad = [
  { key: 'pi', display: '\\pi', insert: '\\pi' },
  { key: 'sin', display: '\\sin(x)', insert: '\\sin(x)' },
  { key: 'cos', display: '\\cos(x)', insert: '\\cos(x)' },
  { key: 'tan', display: '\\tan(x)', insert: '\\tan(x)' },
  { key: 'exp', display: 'e^{x}', insert: 'e^{x}' },
  { key: 'ln', display: '\\ln(x)', insert: '\\ln(x)' },
  { key: 'abs', display: '\\left|x\\right|', insert: '\\left|x\\right|' },
  { key: 'sqrt', display: '\\sqrt{x}', insert: '\\sqrt{x}' },
  { key: 'power', display: 'x^{2}', insert: '^{2}' },
  { key: 'plus', display: '+', insert: '+' },
  { key: 'minus', display: '-', insert: '-' },
  { key: 'multiply', display: '\\cdot', insert: '\\cdot ' },
  { key: 'left-paren', display: '(', insert: '(' },
  { key: 'right-paren', display: ')', insert: ')' }
];

const MathInput = ({ value, onChange, placeholder, showPreview = true, onInteract }: MathInputProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (!input) return;
    onInteract?.();

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
        onChange={(e) => {
          onInteract?.();
          onChange(e.target.value);
        }}
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
              key={key.key}
              variant="ghost"
              className="border border-slate-800 px-2 py-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                insertToken(key.insert);
              }}
              aria-label={key.display}
            >
              <MathJax dynamic inline>{`\\( ${key.display} \\)`}</MathJax>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MathInput;
