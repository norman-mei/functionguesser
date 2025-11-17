import { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const styles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-500 hover:bg-indigo-600 text-white shadow shadow-indigo-900/40 focus:ring-2 focus:ring-indigo-400',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-slate-500',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-100'
};

const Button = ({
  variant = 'primary',
  className,
  children,
  ...rest
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      className={clsx(
        'rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-60',
        styles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
