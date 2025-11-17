import clsx from 'clsx';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header = ({ onOpenSettings }: HeaderProps) => {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--panel)] px-6 py-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Function Guesser</h1>
          <p className="text-sm text-[var(--muted)]">
            Observe the graph, peel back layers, and uncover the secret function.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className={clsx(
            'group relative flex items-center gap-2 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-2 py-1 text-lg transition'
          )}
          aria-label="Open settings"
        >
          <span className="transition-transform group-hover:rotate-90">⚙️</span>
          <span className="max-w-0 translate-x-[-10px] text-sm text-[var(--muted)] opacity-0 transition-all duration-300 group-hover:max-w-[120px] group-hover:translate-x-0 group-hover:opacity-100">
            Settings
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
