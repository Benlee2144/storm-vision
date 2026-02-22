const NWS_BASE = 'https://api.weather.gov';
const HEADERS = {
  'User-Agent': '(StormVision, contact@stormvision.app)',
  Accept: 'application/geo+json',
};

async function nwsFetch(url: string) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`NWS API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export interface NWSPoint {
  forecast: string;
  forecastHourly: string;
  forecastGridData: string;
  observationStations: string;
  relativeLocation: {
    properties: {
      city: string;
      state: string;
    };
  };
  timeZone: string;
}

export async function getPoint(lat: number, lon: number): Promise<NWSPoint> {
  const data = await nwsFetch(`${NWS_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
  return data.properties;
}

export interface NWSForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string | null;
  probabilityOfPrecipitation: { value: number | null };
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

export async function getForecast(forecastUrl: string): Promise<NWSForecastPeriod[]> {
  const data = await nwsFetch(forecastUrl);
  return data.properties.periods;
}

export async function getHourlyForecast(hourlyUrl: string): Promise<NWSForecastPeriod[]> {
  const data = await nwsFetch(hourlyUrl);
  return data.properties.periods;
}

export interface NWSObservation {
  timestamp: string;
  textDescription: string;
  icon: string;
  temperature: { value: number | null; unitCode: string };
  dewpoint: { value: number | null; unitCode: string };
  windDirection: { value: number | null };
  windSpeed: { value: number | null; unitCode: string };
  windGust: { value: number | null; unitCode: string };
  barometricPressure: { value: number | null; unitCode: string };
  visibility: { value: number | null; unitCode: string };
  relativeHumidity: { value: number | null };
  heatIndex: { value: number | null; unitCode: string };
  windChill: { value: number | null; unitCode: string };
}

export async function getLatestObservation(stationsUrl: string): Promise<NWSObservation | null> {
  try {
    const stationsData = await nwsFetch(stationsUrl);
    const stations = stationsData.features || stationsData.observationStations;
    if (!stations || stations.length === 0) return null;
    const stationId = typeof stations[0] === 'string'
      ? stations[0].split('/').pop()
      : stations[0].properties.stationIdentifier;
    const obsData = await nwsFetch(`${NWS_BASE}/stations/${stationId}/observations/latest`);
    return obsData.properties;
  } catch {
    return null;
  }
}

export interface NWSAlert {
  id: string;
  areaDesc: string;
  geocode: { SAME: string[]; UGC: string[] };
  affectedZones: string[];
  references: Array<{ identifier: string }>;
  sent: string;
  effective: string;
  onset: string;
  expires: string;
  ends: string | null;
  status: string;
  messageType: string;
  category: string;
  severity: string;
  certainty: string;
  urgency: string;
  event: string;
  sender: string;
  senderName: string;
  headline: string;
  description: string;
  instruction: string | null;
  response: string;
  parameters: Record<string, string[]>;
}

export interface NWSAlertFeature {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  } | null;
  properties: NWSAlert;
}

export async function getActiveAlerts(params?: {
  area?: string;
  point?: string;
  event?: string;
  severity?: string;
}): Promise<NWSAlertFeature[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('status', 'actual');
  searchParams.set('message_type', 'alert,update');
  if (params?.area) searchParams.set('area', params.area);
  if (params?.point) searchParams.set('point', params.point);
  if (params?.event) searchParams.set('event', params.event);
  if (params?.severity) searchParams.set('severity', params.severity);

  const data = await nwsFetch(`${NWS_BASE}/alerts/active?${searchParams.toString()}`);
  return data.features || [];
}

export async function getAlertById(id: string): Promise<NWSAlertFeature> {
  const data = await nwsFetch(`${NWS_BASE}/alerts/${id}`);
  return data;
}

export async function getAllActiveAlertCount(): Promise<{ total: number; severe: number }> {
  const data = await nwsFetch(`${NWS_BASE}/alerts/active/count`);
  const zones = data.zones || {};
  const total = Object.values(zones).reduce((sum: number, count) => sum + (count as number), 0);
  return { total, severe: data.total || total };
}
