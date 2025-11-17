import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import GameContainer from './components/GameContainer';
import SettingsModal from './components/SettingsModal';
import { UserSettings } from './core/types';

const defaultSettings: UserSettings = {
  theme: 'system',
  accent: '#6366f1',
  enabledDifficulties: [
    'very easy',
    'easy',
    'medium-easy',
    'medium',
    'hard-medium',
    'hard',
    'very hard'
  ],
  showMathPreview: true,
  showGrid: true,
  showAxes: true,
  boldGuessLine: true
};

function App() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fg-settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (settings.theme === 'system') {
        setSettings((prev) => ({ ...prev }));
      }
    };
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [settings.theme]);

  const resolvedTheme = useMemo(() => {
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.setProperty('--accent', settings.accent);
    localStorage.setItem('fg-settings', JSON.stringify(settings));
  }, [resolvedTheme, settings]);

  const layoutClasses = useMemo(
    () => 'bg-[var(--bg)] text-[var(--text)]',
    []
  );

  return (
    <div className={`min-h-screen ${layoutClasses}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <GameContainer settings={settings} />
      </main>
      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onChange={(next) => setSettings((prev) => ({ ...prev, ...next }))}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
