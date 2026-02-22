'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchLocation, type GeocodingResult } from '@/lib/api/geocoding';
import { useLocationStore } from '@/stores/useLocationStore';
import { useRouter } from 'next/navigation';

interface Props {
  onSelect?: (result: GeocodingResult) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  navigateOnSelect?: boolean;
}

export function LocationSearch({
  onSelect,
  placeholder = 'Search any US city or zip code...',
  className = '',
  size = 'md',
  navigateOnSelect = true,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setCurrentLocation } = useLocationStore();
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchLocation(q);
      setResults(res);
      setOpen(res.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 400);
  };

  const handleSelect = (result: GeocodingResult) => {
    const name = result.city
      ? `${result.city}, ${result.state}`
      : result.displayName.split(',').slice(0, 2).join(',');
    setCurrentLocation({ lat: result.lat, lon: result.lon, name });
    setQuery(name);
    setOpen(false);
    onSelect?.(result);
    if (navigateOnSelect) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      router.push(`/forecast/${slug}?lat=${result.lat}&lon=${result.lon}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeStyles = {
    sm: 'h-10 text-sm pl-9 pr-8',
    md: 'h-12 text-base pl-11 pr-10',
    lg: 'h-14 text-lg pl-12 pr-12',
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={size === 'lg' ? 22 : size === 'md' ? 18 : 16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] z-10"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full rounded-2xl glass border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all ${sizeStyles[size]} ${focused ? 'shadow-lg shadow-[var(--primary)]/5' : ''}`}
          aria-label="Search location"
          role="combobox"
          aria-expanded={open}
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)] animate-spin"
          />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-2 w-full rounded-xl glass shadow-2xl border border-[var(--border)] overflow-hidden max-h-72 overflow-y-auto"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-[var(--border)] last:border-0"
              >
                <MapPin size={16} className="text-[var(--primary)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {r.city || r.displayName.split(',')[0]}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">
                    {r.state || r.displayName}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
