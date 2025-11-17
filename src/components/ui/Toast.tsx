import clsx from 'clsx';
import Button from './Button';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast = ({ message, onClose }: ToastProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-lg shadow-black/20">
      <div className="text-sm text-[var(--text)]">{message}</div>
      <Button
        variant="ghost"
        className={clsx('p-1 text-[var(--muted)] hover:text-[var(--text)]')}
        onClick={onClose}
        aria-label="Close notification"
      >
        ✕
      </Button>
    </div>
  );
};

export default Toast;
