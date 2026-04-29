import { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'subtle' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, CSSProperties> = {
  default: {
    background: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
  },
  subtle: {
    background: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-mid)',
  },
  elevated: {
    background: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-elevated)',
  },
};

export function Card({ variant = 'default', children, style, ...props }: CardProps) {
  return (
    <div style={{ ...variantStyles[variant], ...style }} {...props}>
      {children}
    </div>
  );
}
