'use client';
import { useCallback } from 'react';
import { Share2 } from 'lucide-react';

interface Props {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export function ShareButton({
  title = 'Storm Vision',
  text = 'Check out this free live storm tracking platform!',
  url,
  className = '',
}: Props) {
  const handleShare = useCallback(async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    }
  }, [title, text, url]);

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass hover:bg-white/10 transition-colors ${className}`}
      aria-label="Share"
    >
      <Share2 size={14} />
      Share
    </button>
  );
}
