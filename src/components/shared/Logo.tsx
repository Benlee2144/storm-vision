'use client';
import { Zap } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ collapsed = false, size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 20 : size === 'md' ? 24 : 32;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="absolute inset-0 bg-[var(--primary)] blur-lg opacity-40 rounded-full" />
        <div className="relative bg-gradient-to-br from-[var(--primary)] to-cyan-600 p-2 rounded-xl">
          <Zap size={iconSize} className="text-white" fill="currentColor" />
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight leading-none ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-base'}`}>
            Storm<span className="text-[var(--primary)]">Vision</span>
          </span>
          {size === 'lg' && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] mt-0.5">
              Weather Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
}
