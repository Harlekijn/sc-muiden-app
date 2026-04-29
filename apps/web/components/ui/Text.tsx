import { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'label' | 'caption' | 'score';

interface TextProps {
  variant?: TextVariant;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const variantStyles: Record<TextVariant, CSSProperties> = {
  h1: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 },
  h2: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.15 },
  h3: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 },
  h4: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 },
  body: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 400, color: 'var(--color-text)', lineHeight: 1.5 },
  label: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.02em' },
  caption: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-text-2)', lineHeight: 1.4 },
  score: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
};

export function Text({ variant = 'body', children, style, className }: TextProps) {
  const merged: CSSProperties = { ...variantStyles[variant], ...style };
  const shared: HTMLAttributes<HTMLElement> = { style: merged, className };

  if (variant === 'h1') return <h1 {...shared}>{children}</h1>;
  if (variant === 'h2') return <h2 {...shared}>{children}</h2>;
  if (variant === 'h3') return <h3 {...shared}>{children}</h3>;
  if (variant === 'h4') return <h4 {...shared}>{children}</h4>;
  if (variant === 'body') return <p {...shared}>{children}</p>;
  return <span {...shared}>{children}</span>;
}
