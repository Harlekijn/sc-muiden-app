import { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--color-navy)', color: 'var(--color-white)', border: 'none' },
  secondary: { background: 'var(--color-blue)', color: 'var(--color-white)', border: 'none' },
  ghost: { background: 'transparent', color: 'var(--color-blue)', border: '1.5px solid var(--color-blue)' },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 'var(--text-sm)', minHeight: 36 },
  md: { padding: '10px 16px', fontSize: 'var(--text-base)', minHeight: 44 },
  lg: { padding: '14px 24px', fontSize: 'var(--text-md)', minHeight: 52 },
};

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'filter var(--transition-fast)',
  outline: 'none',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        opacity: disabled || loading ? 0.4 : 1,
        ...style,
      }}
      {...props}
    >
      {loading ? '…' : children}
    </button>
  );
}
