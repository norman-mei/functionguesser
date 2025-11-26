import { useEffect, useMemo, useRef, useState } from 'react';
import GameContainer, { GameContainerHandle } from './GameContainer';
import { UserSettings } from '../core/types';
import Button from './ui/Button';
import { Clock, Trophy, Play, RotateCcw, Square } from 'lucide-react';

interface TimedModeProps {
  settings: UserSettings;
  onNotify?: (message: string) => void;
  onSettingsChange: (next: Partial<UserSettings>) => void;
}

const TimedMode = ({ settings, onNotify, onSettingsChange }: TimedModeProps) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(settings.timedMinutes * 60);
  const [solved, setSolved] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);
  const containerRef = useRef<GameContainerHandle | null>(null);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const resetTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
  };

  const stopSession = () => {
    setSessionActive(false);
    resetTimer();
  };

  const startSession = (opts?: { restart?: boolean }) => {
    stopSession();
    if (opts?.restart || hasStartedOnce) {
      containerRef.current?.newPuzzle();
    }
    setHasStartedOnce(true);
    setSolved(0);
    setRemainingSeconds(settings.timedMinutes * 60);
    // setSessionKey((k) => k + 1); // Removed to prevent clearing history
    const end = Date.now() + settings.timedMinutes * 60 * 1000;
    endTimeRef.current = end;
    setSessionActive(true);
    intervalRef.current = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        stopSession();
        onNotify?.('Timed session ended');
      }
    }, 1000);
  };

  const ensureSessionActive = () => {
    if (!sessionActive) {
      startSession();
    }
  };

  useEffect(() => {
    return () => {
      resetTimer();
    };
  }, []);

  useEffect(() => {
    if (!sessionActive) return;
    // Adjust countdown if user changes duration mid-session
    const desiredEnd = Date.now() + remainingSeconds * 1000;
    endTimeRef.current = desiredEnd;
  }, [remainingSeconds, sessionActive]);

  const handleSolved = () => {
    if (!sessionActive) return;
    setSolved((s) => s + 1);
  };

  const timeLabel = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timed mode</p>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Speed Run Challenge
          </h2>
          <p className="text-sm text-muted-foreground">
            Solve as many puzzles as you can in {settings.timedMinutes} minutes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 rounded-lg border bg-muted/50 px-4 py-2">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Time</p>
              <p className="text-2xl font-mono font-bold tabular-nums leading-none">{timeLabel}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
              <div className="flex items-center gap-1 justify-center">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <p className="text-2xl font-bold leading-none">{solved}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                containerRef.current?.newPuzzle();
                if (!sessionActive) {
                  startSession({ restart: hasStartedOnce });
                }
              }}
              className="gap-2"
            >
              {sessionActive ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Skip / New
                </>
              ) : hasStartedOnce ? (
                <>
                  <Play className="h-4 w-4" />
                  Play Again
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>

            {sessionActive && (
              <Button
                variant="destructive"
                onClick={() => stopSession()}
                className="gap-2"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </div>

      <GameContainer
        key={`timed-${sessionKey}`}
        ref={containerRef}
        settings={settings}
        onNotify={onNotify}
        onSettingsChange={onSettingsChange}
        disableAutoAdvance
        onPuzzleSolved={handleSolved}
        completionType="timed"
        persistKey={null}
        onUserAction={ensureSessionActive}
      />
    </div>
  );
};

export default TimedMode;
