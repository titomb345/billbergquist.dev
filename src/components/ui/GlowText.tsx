import { ReactNode } from 'react';
import styles from './GlowText.module.css';

type GlowColor = 'mint' | 'magenta' | 'purple' | 'orange' | 'gradient';
type GlowSize = 'small' | 'medium' | 'large' | 'xlarge';

interface GlowTextProps {
  children: ReactNode;
  color?: GlowColor;
  size?: GlowSize;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
  animated?: boolean;
  className?: string;
}

function GlowText({
  children,
  color = 'mint',
  size = 'medium',
  as: Component = 'h1',
  animated = false,
  className = '',
}: GlowTextProps) {
  const classes = [
    styles.glowText,
    styles[color],
    styles[size],
    animated ? styles.animated : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Component className={classes}>{children}</Component>;
}

export default GlowText;
