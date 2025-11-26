import { cn } from '@/lib/utils';
import Button from './Button';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  position?: 'bottom-right' | 'top-right';
}

const Toast = ({ message, onClose, position = 'bottom-right' }: ToastProps) => {
  const positionClass =
    position === 'top-right' ? 'top-4 right-4' : 'bottom-4 right-4';
  return (
    <div
      className={cn(
        'fixed z-50 flex max-w-sm items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-5',
        positionClass
      )}
    >
      <div className="text-sm font-medium">{message}</div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default Toast;
