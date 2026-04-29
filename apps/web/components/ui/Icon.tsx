import { LucideProps } from 'lucide-react';
import { ComponentType } from 'react';

interface IconProps {
  icon: ComponentType<LucideProps>;
  size?: 16 | 20 | 24;
  color?: string;
  className?: string;
}

export function Icon({ icon: IconComponent, size = 24, color, className }: IconProps) {
  return <IconComponent size={size} color={color} strokeWidth={1.75} className={className} />;
}
