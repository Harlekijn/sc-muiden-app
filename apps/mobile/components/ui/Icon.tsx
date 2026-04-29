import { LucideIcon } from 'lucide-react-native';
import { colors } from '@sc-muiden/shared';

interface IconProps {
  icon: LucideIcon;
  size?: 16 | 20 | 24;
  color?: string;
}

export function Icon({ icon: LucideIconComponent, size = 24, color = colors.text }: IconProps) {
  return <LucideIconComponent size={size} color={color} strokeWidth={1.75} />;
}
