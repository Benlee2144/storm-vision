'use client';

interface Props {
  slot?: string;
  format?: 'banner' | 'rectangle' | 'leaderboard';
  className?: string;
}

/**
 * Placeholder for future ad integration.
 * Replace with real AdSense/Mediavine code when traffic justifies it.
 * For now this renders an invisible div that can be targeted by ad scripts.
 */
export function AdPlaceholder({ slot = 'auto', format = 'banner', className = '' }: Props) {
  const sizes = {
    banner: 'h-[90px]',
    rectangle: 'h-[250px]',
    leaderboard: 'h-[90px] max-w-[728px]',
  };

  return (
    <div
      className={`w-full ${sizes[format]} ${className}`}
      data-ad-slot={slot}
      data-ad-format={format}
      aria-hidden="true"
    >
      {/* Future: Insert AdSense or Mediavine ad unit here */}
    </div>
  );
}

/**
 * BuyMeCoffee floating button placeholder.
 * Replace href with your actual BuyMeCoffee URL.
 */
export function SupportButton() {
  return (
    <a
      href="https://buymeacoffee.com/stormvision"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFDD00]/10 text-[#FFDD00] text-sm font-medium hover:bg-[#FFDD00]/20 transition-colors border border-[#FFDD00]/20"
    >
      <span>&#9749;</span>
      Buy Me a Coffee
    </a>
  );
}

/**
 * Weather gear affiliate placeholder.
 * Replace with Amazon affiliate links.
 */
export function WeatherGearBanner({ className = '' }: { className?: string }) {
  const items = [
    { name: 'Weather Radio', price: '$29', tag: 'Essential' },
    { name: 'Emergency Kit', price: '$45', tag: 'Best Seller' },
    { name: 'Wind Meter', price: '$99', tag: 'Pro' },
    { name: 'Rain Gauge', price: '$15', tag: 'Budget' },
  ];

  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
          Storm Prep Essentials
        </h3>
        <span className="text-[9px] text-[var(--text-tertiary)] uppercase">Affiliate</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex-none w-32 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-full h-16 rounded-lg bg-white/5 mb-2 flex items-center justify-center text-[var(--text-tertiary)] text-xs">
              {item.tag}
            </div>
            <p className="text-xs font-medium truncate">{item.name}</p>
            <p className="text-xs text-[var(--primary)] font-bold">{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
