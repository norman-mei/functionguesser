import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from './components/Header';
import GameContainer from './components/GameContainer';
import SettingsModal from './components/SettingsModal';
import Toast from './components/ui/Toast';
import TimedMode from './components/TimedMode';
import CreateLevelMode from './components/CreateLevelMode';
import OnlineLevelsMode from './components/OnlineLevelsMode';
import YourLevelsMode from './components/YourLevelsMode';
import ScribbleMode from './components/ScribbleMode';
import { ChallengeType, UserSettings } from './core/types';
import { resetPuzzleCounter } from './core/puzzles';

export const defaultSettings: UserSettings = {
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
  boldGuessLine: true,
  controlPanelWidth: 400,
  historyWidth: 300,
  functionLengthTarget: 80,
  timedMinutes: 10
};

interface AppProps {
  challengeType?: ChallengeType;
  mode?: 'play' | 'timed' | 'create' | 'online' | 'your-levels' | 'scribble';
  levelId?: string;
}

function App({ challengeType, mode = 'play', levelId }: AppProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [customLevelData, setCustomLevelData] = useState<any>(null);

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
    if (typeof window === 'undefined') {
      return 'light';
    }

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

  const showToast = useCallback((message: string) => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    setToastMessage(message);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 5000);
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    setToastMessage(null);
  }, []);

  const layoutClasses = useMemo(() => 'bg-[var(--bg)] text-[var(--text)]', []);

  const handleResetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem('fg-settings', JSON.stringify(defaultSettings));
    resetPuzzleCounter();
    setGameKey((k) => k + 1);
    showToast('Settings reset to default');
  }, [showToast]);

  const handleResetProgress = useCallback(() => {
    localStorage.removeItem('fg-settings');
    localStorage.removeItem('fg-current-puzzle');
    resetPuzzleCounter();
    setSettings(defaultSettings);
    setGameKey((k) => k + 1);
    showToast('Progress reset on this device');
  }, [showToast]);

  const handleTestLevel = (levelData: any) => {
    setCustomLevelData(levelData);
  };

  const renderContent = () => {
    if (customLevelData) {
      return (
        <GameContainer
          key={`test-${gameKey}`}
          settings={settings}
          onNotify={showToast}
          onSettingsChange={(next) => setSettings((prev) => ({ ...prev, ...next }))}
          customLevelData={customLevelData}
          onUserAction={() => { }}
        />
      );
    }

    switch (mode) {
      case 'timed':
        return (
          <TimedMode
            settings={settings}
            onNotify={showToast}
            onSettingsChange={(next) => setSettings((prev) => ({ ...prev, ...next }))}
          />
        );
      case 'create':
        return (
          <CreateLevelMode
            onTest={handleTestLevel}
            onBack={() => router.push('/')}
          />
        );
      case 'your-levels':
        return (
          <YourLevelsMode
            onPlay={(id) => router.push(`/play/${id}`)}
            onBack={() => router.push('/')}
          />
        );
      case 'online':
        return (
          <OnlineLevelsMode
            onPlay={(id) => router.push(`/play/${id}`)}
            onBack={() => router.push('/')}
          />
        );
      case 'scribble':
        return (
          <ScribbleMode
            onBack={() => router.push('/')}
          />
        );
      case 'play':
      default:
        return (
          <GameContainer
            key={gameKey}
            settings={settings}
            onNotify={showToast}
            onSettingsChange={(next) => setSettings((prev) => ({ ...prev, ...next }))}
            challengeType={challengeType}
            customLevelId={levelId}
          />
        );
    }
  };

  const resetClickState = useRef<{ count: number; lastTs: number }>({ count: 0, lastTs: 0 });

  const handleTripleClickReset = useCallback(() => {
    const now = Date.now();
    const windowMs = 5000;
    if (now - resetClickState.current.lastTs > windowMs) {
      resetClickState.current = { count: 1, lastTs: now };
      showToast('2 more clicks to reset puzzles');
      return;
    }
    resetClickState.current.count += 1;
    resetClickState.current.lastTs = now;
    const remaining = 3 - resetClickState.current.count;
    if (remaining > 0) {
      showToast(`${remaining} more click${remaining === 1 ? '' : 's'} to reset puzzles`);
      return;
    }
    resetClickState.current = { count: 0, lastTs: 0 };
    localStorage.removeItem('fg-current-puzzle');
    resetPuzzleCounter();
    setGameKey((k) => k + 1);
    showToast('Puzzles reset');
  }, [showToast]);

  return (
    <div className={`min-h-screen ${layoutClasses}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} onResetPuzzles={handleTripleClickReset} />
      <main className="w-full px-4 py-8">
        {renderContent()}
      </main>
      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onChange={(next) => {
          setSettings((prev) => ({ ...prev, ...next }));
          showToast('Settings saved');
        }}
        onResetSettings={handleResetSettings}
        onResetProgress={handleResetProgress}
        onClose={() => {
          setSettingsOpen(false);
          showToast('Settings saved');
        }}
      />
      {toastMessage && <Toast message={toastMessage} onClose={closeToast} position="bottom-right" />}
    </div>
  );
}

export default App;
