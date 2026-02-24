const NIFC_BASE = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services';

export interface WildfirePerimeter {
  id: string;
  name: string;
  acres: number;
  containment: number;
  state: string;
  discoveredDate: number;
  modifiedDate: number;
  cause: string;
  type: string;
  longitude: number;
  latitude: number;
}

export interface WildfireCollection {
  features: Array<{
    attributes: {
      OBJECTID: number;
      poly_IncidentName: string;
      poly_GISAcres: number;
      poly_PercentContained: number;
      irwin_POOState: string;
      irwin_FireDiscoveryDateTime: number;
      poly_DateCurrent: number;
      irwin_FireCause: string;
      irwin_IncidentTypeCategory: string;
      poly_PolygonDateTime: number;
    };
    geometry: {
      rings?: number[][][];
    };
  }>;
}

export async function getActiveWildfires(): Promise<WildfireCollection> {
  const url = `${NIFC_BASE}/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID,poly_IncidentName,poly_GISAcres,poly_PercentContained,irwin_POOState,irwin_FireDiscoveryDateTime,poly_DateCurrent,irwin_FireCause,irwin_IncidentTypeCategory,poly_PolygonDateTime&returnGeometry=false&orderByFields=poly_GISAcres+DESC&resultRecordCount=200&f=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NIFC API error: ${res.status}`);
  return res.json();
}

export async function getWildfirePerimetersGeoJSON(): Promise<unknown> {
  const url = `${NIFC_BASE}/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=poly_GISAcres>100&outFields=OBJECTID,poly_IncidentName,poly_GISAcres,poly_PercentContained&returnGeometry=true&outSR=4326&f=geojson&resultRecordCount=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NIFC API error: ${res.status}`);
  return res.json();
}

export function parseWildfire(feature: WildfireCollection['features'][0]): WildfirePerimeter {
  const a = feature.attributes;
  return {
    id: String(a.OBJECTID),
    name: a.poly_IncidentName || 'Unknown Fire',
    acres: Math.round(a.poly_GISAcres || 0),
    containment: a.poly_PercentContained || 0,
    state: a.irwin_POOState || '',
    discoveredDate: a.irwin_FireDiscoveryDateTime || 0,
    modifiedDate: a.poly_DateCurrent || a.poly_PolygonDateTime || 0,
    cause: a.irwin_FireCause || 'Unknown',
    type: a.irwin_IncidentTypeCategory || 'WF',
    longitude: 0,
    latitude: 0,
  };
}

export function formatAcres(acres: number): string {
  if (acres >= 1000000) return `${(acres / 1000000).toFixed(1)}M acres`;
  if (acres >= 1000) return `${(acres / 1000).toFixed(1)}K acres`;
  return `${acres} acres`;
}
