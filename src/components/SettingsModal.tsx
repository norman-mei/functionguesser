import Button from './ui/Button';
import { UserSettings, Difficulty } from '../core/types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onChange: (next: Partial<UserSettings>) => void;
  onClose: () => void;
}

const themeOptions: Array<{ value: UserSettings['theme']; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

const accentOptions = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' }
];

const difficultyOptions: UserSettings['enabledDifficulties'] = [
  'very easy',
  'easy',
  'medium-easy',
  'medium',
  'hard-medium',
  'hard',
  'very hard'
];

const difficultyColors: Record<Difficulty, string> = {
  'very easy': '#22c55e',
  easy: '#86efac',
  'medium-easy': '#a3e635',
  medium: '#f97316',
  'hard-medium': '#fb923c',
  hard: '#f87171',
  'very hard': '#dc2626'
};

const SettingsModal = ({ isOpen, settings, onChange, onClose }: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-lg font-semibold">Settings</p>
            <p className="text-xs text-[var(--muted)]">Adjust your experience.</p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close settings">
            ✕
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Appearance</p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition ${
                    settings.theme === opt.value
                      ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent) 10%,transparent)]'
                      : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={opt.value}
                    checked={settings.theme === opt.value}
                    onChange={() => onChange({ theme: opt.value })}
                  />
                  <span className="text-sm capitalize">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Accent color</p>
              <div className="flex flex-wrap gap-2">
                {accentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ accent: opt.value })}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                      settings.accent === opt.value
                        ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent) 10%,transparent)]'
                        : 'border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                    style={{ color: opt.value }}
                    type="button"
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-[var(--border)]"
                      style={{ backgroundColor: opt.value }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Generate difficulties</p>
            <div className="flex gap-2 text-xs">
              <Button
                variant="secondary"
                onClick={() =>
                  onChange({
                    enabledDifficulties: [...difficultyOptions]
                  })
                }
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  onChange({
                    enabledDifficulties: []
                  })
                }
              >
                Clear all
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {difficultyOptions.map((diff) => (
                <label key={diff} className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={settings.enabledDifficulties.includes(diff)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange({
                        enabledDifficulties: checked
                          ? [...new Set([...settings.enabledDifficulties, diff])]
                          : settings.enabledDifficulties.filter((d) => d !== diff)
                      });
                    }}
                    className="h-4 w-4"
                  />
                  <span
                    className="capitalize font-semibold"
                    style={{ color: difficultyColors[diff] }}
                  >
                    {diff}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Only checked difficulties will be used for new random puzzles.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Graph</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => onChange({ showGrid: e.target.checked })}
                className="h-4 w-4"
              />
              Show grid
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.showAxes}
                onChange={(e) => onChange({ showAxes: e.target.checked })}
                className="h-4 w-4"
              />
              Show axes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.boldGuessLine}
                onChange={(e) => onChange({ boldGuessLine: e.target.checked })}
                className="h-4 w-4"
              />
              Bold final guess line
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Math input</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.showMathPreview}
                onChange={(e) => onChange({ showMathPreview: e.target.checked })}
                className="h-4 w-4"
              />
              Show live LaTeX preview
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked disabled className="h-4 w-4" />
              Keyboard always available (enabled)
            </label>
          </div>

          <div className="space-y-1 text-xs text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-3">
            <p>Changes apply instantly. Settings are lightweight—no heavy backgrounds or animations.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
