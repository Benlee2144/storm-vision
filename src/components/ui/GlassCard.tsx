'use client';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
  animate?: boolean;
}

export function GlassCard({ children, className, hover = false, padding = 'md', onClick, animate = true, style }: GlassCardProps) {
  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  }[padding];

  const Component = animate ? motion.div : 'div';
  const animateProps = animate ? {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};

  return (
    <Component
      className={clsx(
        'glass rounded-2xl',
        paddingClass,
        hover && 'glass-hover cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={style}
      {...animateProps}
    >
      {children}
    </Component>
  );
}
