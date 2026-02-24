'use client';
import { Github, Plus } from 'lucide-react';

export function CommunitySubmit({ className = '' }: { className?: string }) {
  return (
    <div className={`glass rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 rounded-xl bg-white/5">
          <Plus size={20} className="text-[var(--primary)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">Know a great live cam?</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Help us build the world&apos;s largest weather cam database.
            Submit new cameras via a GitHub Pull Request and help
            storm chasers everywhere.
          </p>
          <a
            href="https://github.com/benlee2144/storm-vision/issues/new?title=New+Camera+Submission&body=Camera+Name:%0AStream+URL:%0ALocation:%0ACategory:"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-[var(--text-secondary)] text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <Github size={14} />
            Submit a Camera via GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
