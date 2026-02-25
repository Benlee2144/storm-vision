'use client';
import { Settings, Thermometer, Wind, Droplets, Bell, Moon, Sun, MapPin, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';

export default function SettingsPage() {
  const {
    theme, tempUnit, windUnit, precipUnit,
    notificationsEnabled, alertSeverityThreshold,
    toggleTheme, setTempUnit, setWindUnit, setPrecipUnit,
    setNotificationsEnabled, setAlertSeverityThreshold,
  } = useSettingsStore();

  const { savedLocations, removeSavedLocation } = useLocationStore();
  const { favorites, clearAll: clearFavorites } = useFavoritesStore();

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 page-enter">
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
              <Settings className="text-[var(--primary)]" size={22} />
            </div>
            Settings
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Customize your Storm Vision experience
          </p>
        </div>

        <div className="space-y-4">
          {/* Appearance */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Appearance
            </h2>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={18} className="text-[var(--info)]" /> : <Sun size={18} className="text-[var(--warning)]" />}
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Switch between dark and light mode</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  theme === 'dark' ? 'bg-[var(--primary)]' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  theme === 'dark' ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </GlassCard>

          {/* Units */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Units
            </h2>
            <div className="space-y-4">
              <UnitToggle
                icon={<Thermometer size={18} className="text-[var(--danger)]" />}
                label="Temperature"
                description="Fahrenheit or Celsius"
                options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]}
                current={tempUnit}
                onChange={(v) => setTempUnit(v as 'F' | 'C')}
              />
              <UnitToggle
                icon={<Wind size={18} className="text-[var(--info)]" />}
                label="Wind Speed"
                description="Miles per hour or kilometers"
                options={[{ value: 'mph', label: 'mph' }, { value: 'kph', label: 'kph' }]}
                current={windUnit}
                onChange={(v) => setWindUnit(v as 'mph' | 'kph')}
              />
              <UnitToggle
                icon={<Droplets size={18} className="text-[var(--primary)]" />}
                label="Precipitation"
                description="Inches or millimeters"
                options={[{ value: 'in', label: 'in' }, { value: 'mm', label: 'mm' }]}
                current={precipUnit}
                onChange={(v) => setPrecipUnit(v as 'in' | 'mm')}
              />
            </div>
          </GlassCard>

          {/* Alerts */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Alerts
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-[var(--warning)]" />
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Get alerted for severe weather</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    notificationsEnabled ? 'bg-[var(--primary)]' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    notificationsEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Alert Threshold</p>
                <div className="flex gap-2">
                  {(['minor', 'moderate', 'severe', 'extreme'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setAlertSeverityThreshold(level)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        alertSeverityThreshold === level
                          ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20'
                          : 'bg-white/5 text-[var(--text-tertiary)] hover:bg-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Saved Locations */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Saved Locations
            </h2>
            {savedLocations.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">
                No saved locations. Search for a city to save it.
              </p>
            ) : (
              <div className="space-y-2">
                {savedLocations.map((loc) => (
                  <div key={loc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[var(--primary)]" />
                      <span className="text-sm">{loc.name}</span>
                      {loc.isPrimary && (
                        <span className="text-[9px] bg-[var(--primary)]/15 text-[var(--primary)] px-1.5 py-0.5 rounded-full">Primary</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeSavedLocation(loc.id)}
                      className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Data Management */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Data
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Favorites</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{favorites.length} saved cameras</p>
                </div>
                {favorites.length > 0 && (
                  <button
                    onClick={clearFavorites}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                All data is stored locally in your browser. Nothing is sent to any server.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function UnitToggle({
  icon, label, description, options, current, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  options: { value: string; label: string }[];
  current: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
        </div>
      </div>
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              current === opt.value
                ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
