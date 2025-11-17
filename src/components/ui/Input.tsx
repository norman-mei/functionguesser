import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] shadow-inner shadow-black/10 outline-none transition ring-0 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/50',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
