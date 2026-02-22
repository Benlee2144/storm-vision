export interface AlertTypeConfig {
  color: string;
  bgColor: string;
  glowColor: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';
  icon: string;
  priority: number;
}

export const ALERT_COLORS: Record<string, AlertTypeConfig> = {
  'Tornado Warning': {
    color: '#ff3b3b',
    bgColor: 'rgba(255, 59, 59, 0.15)',
    glowColor: 'rgba(255, 59, 59, 0.3)',
    severity: 'extreme',
    icon: 'tornado',
    priority: 1,
  },
  'Severe Thunderstorm Warning': {
    color: '#ff9500',
    bgColor: 'rgba(255, 149, 0, 0.15)',
    glowColor: 'rgba(255, 149, 0, 0.2)',
    severity: 'severe',
    icon: 'cloud-lightning',
    priority: 2,
  },
  'Flash Flood Warning': {
    color: '#00cc66',
    bgColor: 'rgba(0, 204, 102, 0.15)',
    glowColor: 'rgba(0, 204, 102, 0.2)',
    severity: 'severe',
    icon: 'droplets',
    priority: 3,
  },
  'Tornado Watch': {
    color: '#ffd60a',
    bgColor: 'rgba(255, 214, 10, 0.12)',
    glowColor: 'rgba(255, 214, 10, 0.2)',
    severity: 'moderate',
    icon: 'eye',
    priority: 4,
  },
  'Severe Thunderstorm Watch': {
    color: '#db8c00',
    bgColor: 'rgba(219, 140, 0, 0.12)',
    glowColor: 'rgba(219, 140, 0, 0.15)',
    severity: 'moderate',
    icon: 'eye',
    priority: 5,
  },
  'Flood Warning': {
    color: '#00b359',
    bgColor: 'rgba(0, 179, 89, 0.12)',
    glowColor: 'rgba(0, 179, 89, 0.15)',
    severity: 'severe',
    icon: 'waves',
    priority: 6,
  },
  'Winter Storm Warning': {
    color: '#ff69b4',
    bgColor: 'rgba(255, 105, 180, 0.12)',
    glowColor: 'rgba(255, 105, 180, 0.15)',
    severity: 'severe',
    icon: 'snowflake',
    priority: 7,
  },
  'Blizzard Warning': {
    color: '#ff4500',
    bgColor: 'rgba(255, 69, 0, 0.12)',
    glowColor: 'rgba(255, 69, 0, 0.15)',
    severity: 'extreme',
    icon: 'snowflake',
    priority: 3,
  },
  'Ice Storm Warning': {
    color: '#8b008b',
    bgColor: 'rgba(139, 0, 139, 0.12)',
    glowColor: 'rgba(139, 0, 139, 0.15)',
    severity: 'severe',
    icon: 'snowflake',
    priority: 7,
  },
  'Winter Weather Advisory': {
    color: '#7b68ee',
    bgColor: 'rgba(123, 104, 238, 0.1)',
    glowColor: 'rgba(123, 104, 238, 0.12)',
    severity: 'minor',
    icon: 'snowflake',
    priority: 12,
  },
  'Wind Advisory': {
    color: '#d2b48c',
    bgColor: 'rgba(210, 180, 140, 0.1)',
    glowColor: 'rgba(210, 180, 140, 0.12)',
    severity: 'minor',
    icon: 'wind',
    priority: 13,
  },
  'High Wind Warning': {
    color: '#daa520',
    bgColor: 'rgba(218, 165, 32, 0.12)',
    glowColor: 'rgba(218, 165, 32, 0.15)',
    severity: 'severe',
    icon: 'wind',
    priority: 8,
  },
  'Heat Advisory': {
    color: '#ff7f50',
    bgColor: 'rgba(255, 127, 80, 0.1)',
    glowColor: 'rgba(255, 127, 80, 0.12)',
    severity: 'minor',
    icon: 'thermometer',
    priority: 14,
  },
  'Excessive Heat Warning': {
    color: '#c71585',
    bgColor: 'rgba(199, 21, 133, 0.12)',
    glowColor: 'rgba(199, 21, 133, 0.15)',
    severity: 'extreme',
    icon: 'thermometer',
    priority: 4,
  },
  'Dense Fog Advisory': {
    color: '#708090',
    bgColor: 'rgba(112, 128, 144, 0.1)',
    glowColor: 'rgba(112, 128, 144, 0.12)',
    severity: 'minor',
    icon: 'cloud-fog',
    priority: 15,
  },
  'Flood Watch': {
    color: '#2e8b57',
    bgColor: 'rgba(46, 139, 87, 0.1)',
    glowColor: 'rgba(46, 139, 87, 0.12)',
    severity: 'moderate',
    icon: 'droplets',
    priority: 10,
  },
  'Winter Storm Watch': {
    color: '#4682b4',
    bgColor: 'rgba(70, 130, 180, 0.1)',
    glowColor: 'rgba(70, 130, 180, 0.12)',
    severity: 'moderate',
    icon: 'snowflake',
    priority: 10,
  },
  'Hurricane Warning': {
    color: '#dc143c',
    bgColor: 'rgba(220, 20, 60, 0.15)',
    glowColor: 'rgba(220, 20, 60, 0.25)',
    severity: 'extreme',
    icon: 'hurricane',
    priority: 1,
  },
  'Tropical Storm Warning': {
    color: '#b22222',
    bgColor: 'rgba(178, 34, 34, 0.12)',
    glowColor: 'rgba(178, 34, 34, 0.18)',
    severity: 'extreme',
    icon: 'hurricane',
    priority: 2,
  },
  'Fire Weather Watch': {
    color: '#ffdead',
    bgColor: 'rgba(255, 222, 173, 0.1)',
    glowColor: 'rgba(255, 222, 173, 0.12)',
    severity: 'moderate',
    icon: 'flame',
    priority: 10,
  },
  'Red Flag Warning': {
    color: '#ff1493',
    bgColor: 'rgba(255, 20, 147, 0.12)',
    glowColor: 'rgba(255, 20, 147, 0.15)',
    severity: 'severe',
    icon: 'flame',
    priority: 6,
  },
};

const DEFAULT_ALERT: AlertTypeConfig = {
  color: '#708090',
  bgColor: 'rgba(112, 128, 144, 0.1)',
  glowColor: 'rgba(112, 128, 144, 0.12)',
  severity: 'unknown',
  icon: 'alert-triangle',
  priority: 20,
};

export function getAlertConfig(event: string): AlertTypeConfig {
  return ALERT_COLORS[event] || DEFAULT_ALERT;
}

export function getAlertSeverityClass(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'extreme': return 'alert-extreme';
    case 'severe': return 'alert-severe';
    case 'moderate': return 'alert-moderate';
    case 'minor': return 'alert-minor';
    default: return '';
  }
}
