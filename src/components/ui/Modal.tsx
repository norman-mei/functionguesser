import { PropsWithChildren } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const Modal = ({ title, isOpen, onClose, children, className }: PropsWithChildren<ModalProps>) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
