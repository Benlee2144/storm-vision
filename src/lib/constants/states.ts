export interface USState {
  name: string;
  code: string;
  lat: number;
  lon: number;
  cameraCount?: number;
}

export const US_STATES: USState[] = [
  { name: 'Alabama', code: 'AL', lat: 32.806671, lon: -86.791130 },
  { name: 'Alaska', code: 'AK', lat: 61.370716, lon: -152.404419 },
  { name: 'Arizona', code: 'AZ', lat: 33.729759, lon: -111.431221 },
  { name: 'Arkansas', code: 'AR', lat: 34.969704, lon: -92.373123 },
  { name: 'California', code: 'CA', lat: 36.116203, lon: -119.681564 },
  { name: 'Colorado', code: 'CO', lat: 39.059811, lon: -105.311104 },
  { name: 'Connecticut', code: 'CT', lat: 41.597782, lon: -72.755371 },
  { name: 'Delaware', code: 'DE', lat: 39.318523, lon: -75.507141 },
  { name: 'Florida', code: 'FL', lat: 27.766279, lon: -81.686783 },
  { name: 'Georgia', code: 'GA', lat: 33.040619, lon: -83.643074 },
  { name: 'Hawaii', code: 'HI', lat: 21.094318, lon: -157.498337 },
  { name: 'Idaho', code: 'ID', lat: 44.240459, lon: -114.478828 },
  { name: 'Illinois', code: 'IL', lat: 40.349457, lon: -88.986137 },
  { name: 'Indiana', code: 'IN', lat: 39.849426, lon: -86.258278 },
  { name: 'Iowa', code: 'IA', lat: 42.011539, lon: -93.210526 },
  { name: 'Kansas', code: 'KS', lat: 38.526600, lon: -96.726486 },
  { name: 'Kentucky', code: 'KY', lat: 37.668140, lon: -84.670067 },
  { name: 'Louisiana', code: 'LA', lat: 31.169546, lon: -91.867805 },
  { name: 'Maine', code: 'ME', lat: 44.693947, lon: -69.381927 },
  { name: 'Maryland', code: 'MD', lat: 39.063946, lon: -76.802101 },
  { name: 'Massachusetts', code: 'MA', lat: 42.230171, lon: -71.530106 },
  { name: 'Michigan', code: 'MI', lat: 43.326618, lon: -84.536095 },
  { name: 'Minnesota', code: 'MN', lat: 45.694454, lon: -93.900192 },
  { name: 'Mississippi', code: 'MS', lat: 32.741646, lon: -89.678696 },
  { name: 'Missouri', code: 'MO', lat: 38.456085, lon: -92.288368 },
  { name: 'Montana', code: 'MT', lat: 46.921925, lon: -110.454353 },
  { name: 'Nebraska', code: 'NE', lat: 41.125370, lon: -98.268082 },
  { name: 'Nevada', code: 'NV', lat: 38.313515, lon: -117.055374 },
  { name: 'New Hampshire', code: 'NH', lat: 43.452492, lon: -71.563896 },
  { name: 'New Jersey', code: 'NJ', lat: 40.298904, lon: -74.521011 },
  { name: 'New Mexico', code: 'NM', lat: 34.840515, lon: -106.248482 },
  { name: 'New York', code: 'NY', lat: 42.165726, lon: -74.948051 },
  { name: 'North Carolina', code: 'NC', lat: 35.630066, lon: -79.806419 },
  { name: 'North Dakota', code: 'ND', lat: 47.528912, lon: -99.784012 },
  { name: 'Ohio', code: 'OH', lat: 40.388783, lon: -82.764915 },
  { name: 'Oklahoma', code: 'OK', lat: 35.565342, lon: -96.928917 },
  { name: 'Oregon', code: 'OR', lat: 44.572021, lon: -122.070938 },
  { name: 'Pennsylvania', code: 'PA', lat: 40.590752, lon: -77.209755 },
  { name: 'Rhode Island', code: 'RI', lat: 41.680893, lon: -71.511780 },
  { name: 'South Carolina', code: 'SC', lat: 33.856892, lon: -80.945007 },
  { name: 'South Dakota', code: 'SD', lat: 44.299782, lon: -99.438828 },
  { name: 'Tennessee', code: 'TN', lat: 35.747845, lon: -86.692345 },
  { name: 'Texas', code: 'TX', lat: 31.054487, lon: -97.563461 },
  { name: 'Utah', code: 'UT', lat: 40.150032, lon: -111.862434 },
  { name: 'Vermont', code: 'VT', lat: 44.045876, lon: -72.710686 },
  { name: 'Virginia', code: 'VA', lat: 37.769337, lon: -78.169968 },
  { name: 'Washington', code: 'WA', lat: 47.400902, lon: -121.490494 },
  { name: 'West Virginia', code: 'WV', lat: 38.491226, lon: -80.954453 },
  { name: 'Wisconsin', code: 'WI', lat: 44.268543, lon: -89.616508 },
  { name: 'Wyoming', code: 'WY', lat: 42.755966, lon: -107.302490 },
  { name: 'District of Columbia', code: 'DC', lat: 38.897438, lon: -77.026817 },
];

export const STATE_BY_CODE: Record<string, USState> = {};
US_STATES.forEach(s => { STATE_BY_CODE[s.code] = s; });

export const STATE_BY_NAME: Record<string, USState> = {};
US_STATES.forEach(s => { STATE_BY_NAME[s.name] = s; });
