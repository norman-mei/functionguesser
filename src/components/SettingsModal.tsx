import React from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { UserSettings, Difficulty } from '../core/types';
import { Moon, Sun, Monitor, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onChange: (next: Partial<UserSettings>) => void;
  onClose: () => void;
  onResetSettings?: () => void;
  onResetProgress?: () => void;
}

const themeOptions: Array<{ value: UserSettings['theme']; label: string; icon: React.ReactNode }> = [
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> }
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

const SettingsModal = ({
  isOpen,
  settings,
  onChange,
  onClose,
  onResetSettings,
  onResetProgress
}: SettingsModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      className="max-w-3xl max-h-[80vh] overflow-hidden"
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2 pt-2">
        <div className="space-y-3">
          <p className="text-sm font-medium leading-none">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border p-2 hover:bg-accent hover:text-accent-foreground ${settings.theme === opt.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input bg-transparent'
                  }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  checked={settings.theme === opt.value}
                  onChange={() => onChange({ theme: opt.value })}
                  className="sr-only"
                />
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground">Accent Color</p>
            <div className="flex flex-wrap gap-2">
              {accentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ accent: opt.value })}
                  className={`group relative flex h-8 w-8 items-center justify-center rounded-full border transition-all ${settings.accent === opt.value
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-transparent hover:scale-110'
                    }`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                  type="button"
                >
                  <span className="sr-only">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">Difficulties</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onChange({ enabledDifficulties: [...difficultyOptions] })}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onChange({ enabledDifficulties: [] })}
              >
                None
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {difficultyOptions.map((diff) => (
              <label
                key={diff}
                className="flex items-center gap-2 rounded-md border border-input p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
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
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: difficultyColors[diff] }}
                >
                  {diff}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Function Length</p>
              <span className="text-xs text-muted-foreground">{settings.functionLengthTarget} chars</span>
            </div>
            <input
              type="range"
              min={30}
              max={160}
              step={5}
              value={settings.functionLengthTarget}
              onChange={(e) => onChange({ functionLengthTarget: Number(e.target.value) })}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Timed Mode Duration</p>
              <span className="text-xs text-muted-foreground">{settings.timedMinutes} min</span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={settings.timedMinutes}
              onChange={(e) => onChange({ timedMinutes: Number(e.target.value) })}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium leading-none">Display</p>
          <div className="space-y-2">
            {[
              { key: 'showGrid', label: 'Show Grid' },
              { key: 'showAxes', label: 'Show Axes' },
              { key: 'boldGuessLine', label: 'Bold Guess Line' },
              { key: 'showMathPreview', label: 'Show LaTeX Preview' }
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm cursor-pointer hover:bg-accent">
                <span className="text-sm font-medium">{item.label}</span>
                <input
                  type="checkbox"
                  checked={(settings as any)[item.key]}
                  onChange={(e) => onChange({ [item.key]: e.target.checked })}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">Danger Zone</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/20"
              onClick={() => onResetSettings?.()}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Reset Settings
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onResetProgress?.()}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Reset Progress
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
