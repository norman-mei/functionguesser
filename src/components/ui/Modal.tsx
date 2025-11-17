import { PropsWithChildren } from 'react';
import Button from './Button';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const Modal = ({ title, isOpen, onClose, children }: PropsWithChildren<ModalProps>) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-[var(--text)]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
