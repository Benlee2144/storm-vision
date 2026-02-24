/**
 * Curated live cameras — high-quality, storm-relevant, and viral-worthy.
 * These are separate from the 61K+ DOT cams and are featured prominently.
 * All free, no-auth, public embeddable streams.
 */

export interface CuratedCam {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  city: string;
  state: string;
  stateCode: string;
  category: CamCategory;
  tags: string[];
  streamType: 'youtube' | 'iframe' | 'hls' | 'image_refresh' | 'mjpeg';
  streamUrl: string;
  /** YouTube video ID for embed */
  youtubeId?: string;
  /** Whether this cam is featured on homepage / top of lists */
  featured: boolean;
  /** Storm-prone area — prioritized during severe weather */
  stormProne: boolean;
  attribution: string;
}

export type CamCategory =
  | 'beach'
  | 'skyline'
  | 'mountain'
  | 'highway'
  | 'storm'
  | 'airport'
  | 'harbor'
  | 'volcano'
  | 'wildlife'
  | 'landmark'
  | 'weather_station';

export const CURATED_CAMS: CuratedCam[] = [
  // ═══════════════════════════════════════════
  // BEACH CAMS — Huge traffic during hurricanes
  // ═══════════════════════════════════════════
  {
    id: 'yt-surfline-pipeline',
    name: 'Pipeline, North Shore Oahu',
    description: 'Famous Banzai Pipeline surf break — live 24/7',
    lat: 21.6659,
    lon: -158.0539,
    city: 'Haleiwa',
    state: 'Hawaii',
    stateCode: 'HI',
    category: 'beach',
    tags: ['surf', 'ocean', 'waves', 'tropical'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/dOFzpGqaG9Y',
    youtubeId: 'dOFzpGqaG9Y',
    featured: true,
    stormProne: true,
    attribution: 'Surfline',
  },
  {
    id: 'yt-venice-beach',
    name: 'Venice Beach Boardwalk',
    description: 'Live view of Venice Beach, Los Angeles',
    lat: 33.985,
    lon: -118.473,
    city: 'Los Angeles',
    state: 'California',
    stateCode: 'CA',
    category: 'beach',
    tags: ['beach', 'boardwalk', 'ocean', 'sunset'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/mRe-514tGMg',
    youtubeId: 'mRe-514tGMg',
    featured: true,
    stormProne: false,
    attribution: 'Venice Beach Live',
  },
  {
    id: 'yt-south-beach-miami',
    name: 'South Beach, Miami',
    description: 'Live view of South Beach — hurricane watch hotspot',
    lat: 25.7826,
    lon: -80.1340,
    city: 'Miami Beach',
    state: 'Florida',
    stateCode: 'FL',
    category: 'beach',
    tags: ['beach', 'ocean', 'hurricane', 'tropical'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/XOc0pY3OZGA',
    youtubeId: 'XOc0pY3OZGA',
    featured: true,
    stormProne: true,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-myrtle-beach',
    name: 'Myrtle Beach Boardwalk',
    description: 'Live Myrtle Beach view — hurricane-prone coast',
    lat: 33.6891,
    lon: -78.8867,
    city: 'Myrtle Beach',
    state: 'South Carolina',
    stateCode: 'SC',
    category: 'beach',
    tags: ['beach', 'boardwalk', 'hurricane', 'surf'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/1mKeCBGXwyo',
    youtubeId: '1mKeCBGXwyo',
    featured: true,
    stormProne: true,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-outer-banks',
    name: 'Outer Banks, Kitty Hawk',
    description: 'Live view from Outer Banks — hurricane alley',
    lat: 36.0726,
    lon: -75.7046,
    city: 'Kitty Hawk',
    state: 'North Carolina',
    stateCode: 'NC',
    category: 'beach',
    tags: ['beach', 'ocean', 'hurricane', 'surf'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/M5N3K1oMHqo',
    youtubeId: 'M5N3K1oMHqo',
    featured: false,
    stormProne: true,
    attribution: 'OBX Live',
  },
  {
    id: 'yt-galveston-pier',
    name: 'Galveston Pleasure Pier',
    description: 'Gulf of Mexico view — hurricane hotspot',
    lat: 29.2856,
    lon: -94.7886,
    city: 'Galveston',
    state: 'Texas',
    stateCode: 'TX',
    category: 'beach',
    tags: ['beach', 'pier', 'gulf', 'hurricane'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/jPGnHPOg1KQ',
    youtubeId: 'jPGnHPOg1KQ',
    featured: false,
    stormProne: true,
    attribution: 'Galveston Live',
  },
  {
    id: 'yt-santa-monica',
    name: 'Santa Monica Pier',
    description: 'Iconic Santa Monica Pier and beach',
    lat: 34.0094,
    lon: -118.4973,
    city: 'Santa Monica',
    state: 'California',
    stateCode: 'CA',
    category: 'beach',
    tags: ['beach', 'pier', 'sunset', 'ocean'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/vHBEaHIpCPM',
    youtubeId: 'vHBEaHIpCPM',
    featured: false,
    stormProne: false,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-clearwater-beach',
    name: 'Clearwater Beach',
    description: 'Live from Clearwater Beach, FL — Gulf Coast storms',
    lat: 27.9780,
    lon: -82.8268,
    city: 'Clearwater',
    state: 'Florida',
    stateCode: 'FL',
    category: 'beach',
    tags: ['beach', 'gulf', 'sunset', 'hurricane'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/QfhKD5n5pEA',
    youtubeId: 'QfhKD5n5pEA',
    featured: false,
    stormProne: true,
    attribution: 'Clearwater Beach Cam',
  },
  {
    id: 'yt-key-west',
    name: 'Key West Duval Street',
    description: 'Live from Key West — southernmost point in US',
    lat: 24.5551,
    lon: -81.7800,
    city: 'Key West',
    state: 'Florida',
    stateCode: 'FL',
    category: 'beach',
    tags: ['beach', 'island', 'hurricane', 'tropical'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/c7mBX-kw5Mo',
    youtubeId: 'c7mBX-kw5Mo',
    featured: false,
    stormProne: true,
    attribution: 'EarthCam',
  },

  // ═══════════════════════════════════════════
  // SKYLINE / CITY CAMS — Always popular
  // ═══════════════════════════════════════════
  {
    id: 'yt-nyc-times-square',
    name: 'Times Square, NYC',
    description: 'Live from the heart of Times Square — 24/7',
    lat: 40.758,
    lon: -73.9855,
    city: 'New York',
    state: 'New York',
    stateCode: 'NY',
    category: 'skyline',
    tags: ['city', 'landmark', 'times-square', 'manhattan'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/mRe-514tGMg',
    youtubeId: 'mRe-514tGMg',
    featured: true,
    stormProne: false,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-chicago-skyline',
    name: 'Chicago Skyline',
    description: 'Live view of Chicago skyline and Lake Michigan',
    lat: 41.8827,
    lon: -87.6233,
    city: 'Chicago',
    state: 'Illinois',
    stateCode: 'IL',
    category: 'skyline',
    tags: ['city', 'skyline', 'lake', 'tornado-alley'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/8oy0Oq1mY7Y',
    youtubeId: '8oy0Oq1mY7Y',
    featured: true,
    stormProne: true,
    attribution: 'Chicago Live',
  },
  {
    id: 'yt-la-skyline',
    name: 'Los Angeles Skyline',
    description: 'Downtown Los Angeles panorama',
    lat: 34.0522,
    lon: -118.2437,
    city: 'Los Angeles',
    state: 'California',
    stateCode: 'CA',
    category: 'skyline',
    tags: ['city', 'skyline', 'sunset', 'mountains'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/vHBEaHIpCPM',
    youtubeId: 'vHBEaHIpCPM',
    featured: false,
    stormProne: false,
    attribution: 'LA Live Cam',
  },
  {
    id: 'yt-nashville',
    name: 'Nashville Broadway',
    description: 'Live from Nashville honky-tonk row',
    lat: 36.1622,
    lon: -86.7743,
    city: 'Nashville',
    state: 'Tennessee',
    stateCode: 'TN',
    category: 'skyline',
    tags: ['city', 'nightlife', 'music', 'tornado-alley'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/2lHn08NVa9E',
    youtubeId: '2lHn08NVa9E',
    featured: false,
    stormProne: true,
    attribution: 'Nashville Live',
  },

  // ═══════════════════════════════════════════
  // STORM / WEATHER CAMS — Core of the app
  // ═══════════════════════════════════════════
  {
    id: 'yt-storm-chaser-live',
    name: 'Live Storm Chasing',
    description: 'Reed Timmer / Live storm chasing feed when active',
    lat: 35.2226,
    lon: -97.4395,
    city: 'Oklahoma City',
    state: 'Oklahoma',
    stateCode: 'OK',
    category: 'storm',
    tags: ['storm', 'tornado', 'chasing', 'severe'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/NzPVkrR7IS0',
    youtubeId: 'NzPVkrR7IS0',
    featured: true,
    stormProne: true,
    attribution: 'Storm Chasers',
  },
  {
    id: 'yt-weather-channel-live',
    name: 'Weather Nation Live',
    description: '24/7 live weather coverage and storm tracking',
    lat: 39.7392,
    lon: -104.9903,
    city: 'Denver',
    state: 'Colorado',
    stateCode: 'CO',
    category: 'storm',
    tags: ['weather', 'live', '24/7', 'national'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/U40cWIA4QxI',
    youtubeId: 'U40cWIA4QxI',
    featured: true,
    stormProne: true,
    attribution: 'WeatherNation',
  },
  {
    id: 'yt-okc-tornado-alley',
    name: 'Oklahoma City Sky Cam',
    description: 'Tornado Alley sky cam — ground zero for severe weather',
    lat: 35.4676,
    lon: -97.5164,
    city: 'Oklahoma City',
    state: 'Oklahoma',
    stateCode: 'OK',
    category: 'storm',
    tags: ['tornado', 'tornado-alley', 'severe', 'sky'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/ZRhBpmn4VRg',
    youtubeId: 'ZRhBpmn4VRg',
    featured: true,
    stormProne: true,
    attribution: 'KFOR News',
  },
  {
    id: 'yt-dallas-skycam',
    name: 'Dallas-Fort Worth Sky Cam',
    description: 'DFW metroplex view — severe weather corridor',
    lat: 32.7767,
    lon: -96.7970,
    city: 'Dallas',
    state: 'Texas',
    stateCode: 'TX',
    category: 'storm',
    tags: ['city', 'tornado', 'severe', 'sky'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/cWfDsWRs6wI',
    youtubeId: 'cWfDsWRs6wI',
    featured: false,
    stormProne: true,
    attribution: 'WFAA',
  },

  // ═══════════════════════════════════════════
  // MOUNTAIN / NATURE CAMS
  // ═══════════════════════════════════════════
  {
    id: 'yt-jackson-hole',
    name: 'Jackson Hole Town Square',
    description: 'Live from Jackson Hole, Wyoming — mountain weather',
    lat: 43.4799,
    lon: -110.7624,
    city: 'Jackson',
    state: 'Wyoming',
    stateCode: 'WY',
    category: 'mountain',
    tags: ['mountain', 'snow', 'wildlife', 'town'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/psfFJR3vZ78',
    youtubeId: 'psfFJR3vZ78',
    featured: true,
    stormProne: true,
    attribution: 'Jackson Hole Live',
  },
  {
    id: 'yt-yellowstone-geyser',
    name: 'Yellowstone Old Faithful',
    description: 'Live Old Faithful geyser and weather cam',
    lat: 44.4605,
    lon: -110.8281,
    city: 'Yellowstone',
    state: 'Wyoming',
    stateCode: 'WY',
    category: 'wildlife',
    tags: ['nature', 'geyser', 'park', 'weather'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/wSGeE9JkVSQ',
    youtubeId: 'wSGeE9JkVSQ',
    featured: true,
    stormProne: true,
    attribution: 'NPS / Yellowstone',
  },
  {
    id: 'yt-mt-washington',
    name: 'Mount Washington Observatory',
    description: 'World\'s worst weather — summit cam at 6,288 ft',
    lat: 44.2706,
    lon: -71.3033,
    city: 'Mt Washington',
    state: 'New Hampshire',
    stateCode: 'NH',
    category: 'mountain',
    tags: ['mountain', 'extreme', 'wind', 'snow', 'observatory'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/GJqI9NDKQ_4',
    youtubeId: 'GJqI9NDKQ_4',
    featured: true,
    stormProne: true,
    attribution: 'Mt. Washington Observatory',
  },

  // ═══════════════════════════════════════════
  // HARBOR / COASTAL
  // ═══════════════════════════════════════════
  {
    id: 'yt-port-aransas',
    name: 'Port Aransas Harbor',
    description: 'Texas Gulf Coast harbor — hurricane watch area',
    lat: 27.8339,
    lon: -97.0611,
    city: 'Port Aransas',
    state: 'Texas',
    stateCode: 'TX',
    category: 'harbor',
    tags: ['harbor', 'gulf', 'boats', 'hurricane'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/4RQVxYSG-D4',
    youtubeId: '4RQVxYSG-D4',
    featured: false,
    stormProne: true,
    attribution: 'Port A Live',
  },
  {
    id: 'yt-destin-fl',
    name: 'Destin Harbor, Florida',
    description: 'Destin Harbor and Gulf of Mexico view',
    lat: 30.3935,
    lon: -86.4958,
    city: 'Destin',
    state: 'Florida',
    stateCode: 'FL',
    category: 'harbor',
    tags: ['harbor', 'gulf', 'boats', 'sunset'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/L8_ghJOG4LQ',
    youtubeId: 'L8_ghJOG4LQ',
    featured: false,
    stormProne: true,
    attribution: 'Destin Live',
  },

  // ═══════════════════════════════════════════
  // VOLCANO / EXTREME
  // ═══════════════════════════════════════════
  {
    id: 'yt-kilauea-volcano',
    name: 'Kilauea Volcano, Hawaii',
    description: 'Live volcanic activity cam',
    lat: 19.4069,
    lon: -155.2834,
    city: 'Hawaii Volcanoes',
    state: 'Hawaii',
    stateCode: 'HI',
    category: 'volcano',
    tags: ['volcano', 'lava', 'nature', 'extreme'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/lM5ki2ICkao',
    youtubeId: 'lM5ki2ICkao',
    featured: false,
    stormProne: false,
    attribution: 'USGS',
  },

  // ═══════════════════════════════════════════
  // AIRPORT CAMS
  // ═══════════════════════════════════════════
  {
    id: 'yt-sfo-airport',
    name: 'San Francisco Airport (SFO)',
    description: 'SFO runway and bay view — fog and weather impacts',
    lat: 37.6213,
    lon: -122.3790,
    city: 'San Francisco',
    state: 'California',
    stateCode: 'CA',
    category: 'airport',
    tags: ['airport', 'planes', 'fog', 'runway'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/GJ17rSIA0bY',
    youtubeId: 'GJ17rSIA0bY',
    featured: false,
    stormProne: false,
    attribution: 'SFO Live',
  },
  {
    id: 'yt-lax-airport',
    name: 'LAX Airport Live',
    description: 'Los Angeles International Airport runway cam',
    lat: 33.9425,
    lon: -118.4081,
    city: 'Los Angeles',
    state: 'California',
    stateCode: 'CA',
    category: 'airport',
    tags: ['airport', 'planes', 'runway', 'aviation'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/d-S15qgjDD8',
    youtubeId: 'd-S15qgjDD8',
    featured: false,
    stormProne: false,
    attribution: 'LAX Live',
  },

  // ═══════════════════════════════════════════
  // LANDMARK CAMS
  // ═══════════════════════════════════════════
  {
    id: 'yt-niagara-falls',
    name: 'Niagara Falls',
    description: 'Live view of Niagara Falls — spectacular weather events',
    lat: 43.0962,
    lon: -79.0377,
    city: 'Niagara Falls',
    state: 'New York',
    stateCode: 'NY',
    category: 'landmark',
    tags: ['waterfall', 'landmark', 'nature', 'ice'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/kOg6x4BU_yk',
    youtubeId: 'kOg6x4BU_yk',
    featured: true,
    stormProne: true,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-statue-liberty',
    name: 'Statue of Liberty View',
    description: 'NYC harbor and Statue of Liberty panorama',
    lat: 40.6892,
    lon: -74.0445,
    city: 'New York',
    state: 'New York',
    stateCode: 'NY',
    category: 'landmark',
    tags: ['landmark', 'harbor', 'city', 'iconic'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/E6oiNjicVfU',
    youtubeId: 'E6oiNjicVfU',
    featured: false,
    stormProne: false,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-bourbon-street',
    name: 'Bourbon Street, New Orleans',
    description: 'Live from the French Quarter — hurricane city',
    lat: 29.9584,
    lon: -90.0653,
    city: 'New Orleans',
    state: 'Louisiana',
    stateCode: 'LA',
    category: 'landmark',
    tags: ['city', 'nightlife', 'hurricane', 'historic'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/UNWaepqG6MY',
    youtubeId: 'UNWaepqG6MY',
    featured: true,
    stormProne: true,
    attribution: 'EarthCam',
  },

  // ═══════════════════════════════════════════
  // ADDITIONAL STORM-PRONE CAMS
  // ═══════════════════════════════════════════
  {
    id: 'yt-pensacola-beach',
    name: 'Pensacola Beach',
    description: 'Gulf Coast beach — frontline for Gulf hurricanes',
    lat: 30.3269,
    lon: -87.1508,
    city: 'Pensacola',
    state: 'Florida',
    stateCode: 'FL',
    category: 'beach',
    tags: ['beach', 'gulf', 'hurricane', 'surf'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/o8IPt5cmv7g',
    youtubeId: 'o8IPt5cmv7g',
    featured: false,
    stormProne: true,
    attribution: 'Pensacola Beach Cam',
  },
  {
    id: 'yt-atlantic-city',
    name: 'Atlantic City Boardwalk',
    description: 'Atlantic City boardwalk and beach — nor\'easter zone',
    lat: 39.3643,
    lon: -74.4229,
    city: 'Atlantic City',
    state: 'New Jersey',
    stateCode: 'NJ',
    category: 'beach',
    tags: ['beach', 'boardwalk', 'noreaster', 'ocean'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/YHvHcqbExco',
    youtubeId: 'YHvHcqbExco',
    featured: false,
    stormProne: true,
    attribution: 'EarthCam',
  },
  {
    id: 'yt-st-pete-beach',
    name: 'St. Pete Beach, Florida',
    description: 'St. Petersburg Beach — Tampa Bay hurricane zone',
    lat: 27.7253,
    lon: -82.7411,
    city: 'St. Pete Beach',
    state: 'Florida',
    stateCode: 'FL',
    category: 'beach',
    tags: ['beach', 'gulf', 'hurricane', 'sunset'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/tnmW5Smh0U4',
    youtubeId: 'tnmW5Smh0U4',
    featured: false,
    stormProne: true,
    attribution: 'St. Pete Beach Cam',
  },
  {
    id: 'yt-corpus-christi',
    name: 'Corpus Christi Bay',
    description: 'Texas Gulf Coast — hurricane landfall zone',
    lat: 27.8006,
    lon: -97.3964,
    city: 'Corpus Christi',
    state: 'Texas',
    stateCode: 'TX',
    category: 'beach',
    tags: ['beach', 'gulf', 'hurricane', 'bay'],
    streamType: 'youtube',
    streamUrl: 'https://www.youtube.com/embed/3rRXJSoVH9g',
    youtubeId: '3rRXJSoVH9g',
    featured: false,
    stormProne: true,
    attribution: 'Corpus Christi Live',
  },
];

/** Get cams filtered by category */
export function getCamsByCategory(category: CamCategory): CuratedCam[] {
  return CURATED_CAMS.filter((c) => c.category === category);
}

/** Get featured cams */
export function getFeaturedCams(): CuratedCam[] {
  return CURATED_CAMS.filter((c) => c.featured);
}

/** Get storm-prone cams */
export function getStormProneCams(): CuratedCam[] {
  return CURATED_CAMS.filter((c) => c.stormProne);
}

/** All unique categories with counts */
export function getCamCategoryStats(): { category: CamCategory; count: number }[] {
  const counts: Record<string, number> = {};
  CURATED_CAMS.forEach((c) => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([category, count]) => ({ category: category as CamCategory, count }))
    .sort((a, b) => b.count - a.count);
}

/** All unique states with curated cam counts */
export function getCamStateStats(): { stateCode: string; state: string; count: number }[] {
  const counts: Record<string, { state: string; count: number }> = {};
  CURATED_CAMS.forEach((c) => {
    if (!counts[c.stateCode]) counts[c.stateCode] = { state: c.state, count: 0 };
    counts[c.stateCode].count++;
  });
  return Object.entries(counts)
    .map(([stateCode, { state, count }]) => ({ stateCode, state, count }))
    .sort((a, b) => b.count - a.count);
}

/** Search curated cams by query */
export function searchCuratedCams(query: string): CuratedCam[] {
  if (!query.trim()) return CURATED_CAMS;
  const q = query.toLowerCase();
  return CURATED_CAMS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.stateCode.toLowerCase() === q ||
      c.category.includes(q) ||
      c.tags.some((t) => t.includes(q)) ||
      c.description.toLowerCase().includes(q)
  );
}
