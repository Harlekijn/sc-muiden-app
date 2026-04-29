import { CSSProperties } from 'react';

type BadgeVariant =
  | 'voetbal'
  | 'hockey'
  | 'live'
  | 'gepland'
  | 'gespeeld'
  | 'success'
  | 'error'
  | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const badgeColors: Record<BadgeVariant, { bg: string; color: string }> = {
  voetbal: { bg: 'var(--color-blue)', color: 'var(--color-white)' },
  hockey: { bg: 'var(--color-success)', color: 'var(--color-white)' },
  live: { bg: 'var(--color-error)', color: 'var(--color-white)' },
  gepland: { bg: 'var(--color-navy-12)', color: 'var(--color-navy)' },
  gespeeld: { bg: 'var(--color-mid)', color: 'var(--color-text-2)' },
  success: { bg: 'var(--color-success)', color: 'var(--color-white)' },
  error: { bg: 'var(--color-error)', color: 'var(--color-white)' },
  warning: { bg: 'var(--color-warning)', color: 'var(--color-white)' },
};

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 'var(--radius-pill)',
  padding: '3px 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
};

export function Badge({ label, variant = 'gepland' }: BadgeProps) {
  const { bg, color } = badgeColors[variant];
  return (
    <span style={{ ...baseStyle, background: bg, color }}>
      {label}
    </span>
  );
}
