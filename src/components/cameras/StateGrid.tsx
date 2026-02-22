'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { US_STATES } from '@/lib/constants/states';
import { MapPin } from 'lucide-react';

interface Props {
  cameraCounts?: Record<string, number>;
  onStateSelect?: (stateCode: string) => void;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.02 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function StateGrid({ cameraCounts = {}, onStateSelect }: Props) {
  return (
    <motion.div
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {US_STATES.map((state) => {
        const count = cameraCounts[state.code] || 0;
        const inner = (
          <>
            <span className="text-lg font-bold text-[var(--primary)] group-hover:scale-110 transition-transform">
              {state.code}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] text-center truncate w-full">
              {state.name}
            </span>
            {count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-secondary)] data-mono">
                <MapPin size={8} />
                {count.toLocaleString()}
              </span>
            )}
          </>
        );

        return (
          <motion.div key={state.code} variants={fadeUp}>
            {onStateSelect ? (
              <button
                onClick={() => onStateSelect(state.code)}
                className="w-full flex flex-col items-center gap-1 p-3 rounded-xl glass hover:bg-white/5 hover:border-[var(--border-hover)] transition-all group"
              >
                {inner}
              </button>
            ) : (
              <Link
                href={`/cameras/state/${state.code.toLowerCase()}`}
                className="flex flex-col items-center gap-1 p-3 rounded-xl glass hover:bg-white/5 hover:border-[var(--border-hover)] transition-all group"
              >
                {inner}
              </Link>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
