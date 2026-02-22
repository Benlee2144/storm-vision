import { point, polygon, multiPolygon, booleanPointInPolygon } from '@turf/turf';
import type { NWSAlertFeature } from '@/lib/api/nws';
import type { CameraData } from '@/components/cameras/CameraCard';

export interface StormCamera {
  camera: CameraData;
  alerts: NWSAlertFeature[];
  distance: number; // rough distance to polygon centroid in km
}

export interface StormCamGroup {
  alert: NWSAlertFeature;
  cameras: CameraData[];
}

/**
 * Check if a camera's lat/lng falls within an alert's polygon geometry.
 */
function cameraInAlertPolygon(camera: CameraData, alert: NWSAlertFeature): boolean {
  if (!alert.geometry) return false;

  const pt = point([camera.longitude, camera.latitude]);

  try {
    if (alert.geometry.type === 'Polygon') {
      const poly = polygon(alert.geometry.coordinates as number[][][]);
      return booleanPointInPolygon(pt, poly);
    }
    if (alert.geometry.type === 'MultiPolygon') {
      const mp = multiPolygon(alert.geometry.coordinates as number[][][][]);
      return booleanPointInPolygon(pt, mp);
    }
  } catch {
    // malformed geometry — skip
  }
  return false;
}

/**
 * For alerts without polygon geometry, fall back to matching by area description
 * (county/state names) against the camera's city/state.
 */
function cameraInAlertArea(camera: CameraData, alert: NWSAlertFeature): boolean {
  const areaDesc = alert.properties.areaDesc?.toLowerCase() || '';
  const state = camera.state.toLowerCase();
  const city = camera.city.toLowerCase();

  // Check if the camera's state appears in the alert area description
  if (!areaDesc.includes(state) && !areaDesc.includes(camera.stateCode.toLowerCase())) {
    return false;
  }

  // If we matched state, check for county/city level match
  const areaParts = areaDesc.split(';').map((s) => s.trim().toLowerCase());
  return areaParts.some((part) => part.includes(city));
}

/**
 * Nearby radius fallback: if a camera is within `radiusKm` of the polygon
 * centroid, consider it relevant (catches cameras just outside the polygon
 * that would still see the storm).
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getPolygonCentroid(alert: NWSAlertFeature): [number, number] | null {
  if (!alert.geometry) return null;
  try {
    let coords: number[][];
    if (alert.geometry.type === 'Polygon') {
      coords = (alert.geometry.coordinates as number[][][])[0];
    } else if (alert.geometry.type === 'MultiPolygon') {
      coords = (alert.geometry.coordinates as number[][][][])[0][0];
    } else {
      return null;
    }
    const sumLng = coords.reduce((s, c) => s + c[0], 0);
    const sumLat = coords.reduce((s, c) => s + c[1], 0);
    return [sumLng / coords.length, sumLat / coords.length];
  } catch {
    return null;
  }
}

const NEARBY_RADIUS_KM = 40; // cameras within 40km of a polygon still relevant

/**
 * Find all cameras that are inside or near severe weather warning polygons.
 * Returns cameras grouped by alert.
 */
export function matchCamerasToAlerts(
  cameras: CameraData[],
  alerts: NWSAlertFeature[]
): StormCamGroup[] {
  const severeAlerts = alerts.filter((a) => {
    const event = a.properties.event.toLowerCase();
    return (
      event.includes('tornado warning') ||
      event.includes('severe thunderstorm warning') ||
      event.includes('flash flood warning') ||
      event.includes('hurricane warning') ||
      event.includes('tornado watch') ||
      event.includes('severe thunderstorm watch')
    );
  });

  const groups: StormCamGroup[] = [];

  for (const alert of severeAlerts) {
    const matched: CameraData[] = [];
    const centroid = getPolygonCentroid(alert);

    for (const cam of cameras) {
      // First: polygon containment check
      if (cameraInAlertPolygon(cam, alert)) {
        matched.push(cam);
        continue;
      }

      // Second: nearby radius from polygon centroid
      if (centroid) {
        const dist = haversineDistance(cam.latitude, cam.longitude, centroid[1], centroid[0]);
        if (dist <= NEARBY_RADIUS_KM) {
          matched.push(cam);
          continue;
        }
      }

      // Third: area description fallback (no geometry)
      if (!alert.geometry && cameraInAlertArea(cam, alert)) {
        matched.push(cam);
      }
    }

    if (matched.length > 0) {
      groups.push({ alert, cameras: matched });
    }
  }

  // Sort: tornado warnings first, then severe thunderstorm, etc.
  groups.sort((a, b) => {
    const priorityOrder = [
      'tornado warning',
      'severe thunderstorm warning',
      'flash flood warning',
      'hurricane warning',
      'tornado watch',
      'severe thunderstorm watch',
    ];
    const aIdx = priorityOrder.findIndex((p) => a.alert.properties.event.toLowerCase().includes(p));
    const bIdx = priorityOrder.findIndex((p) => b.alert.properties.event.toLowerCase().includes(p));
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return groups;
}

/**
 * Get a flat, deduplicated list of all cameras in active warning areas.
 */
export function getAllStormCameras(
  cameras: CameraData[],
  alerts: NWSAlertFeature[]
): StormCamera[] {
  const groups = matchCamerasToAlerts(cameras, alerts);
  const seen = new Set<string>();
  const result: StormCamera[] = [];

  for (const group of groups) {
    const centroid = getPolygonCentroid(group.alert);
    for (const cam of group.cameras) {
      if (seen.has(cam.id)) {
        // Add alert to existing entry
        const existing = result.find((r) => r.camera.id === cam.id);
        if (existing && !existing.alerts.find((a) => a.id === group.alert.id)) {
          existing.alerts.push(group.alert);
        }
        continue;
      }
      seen.add(cam.id);
      const dist = centroid
        ? haversineDistance(cam.latitude, cam.longitude, centroid[1], centroid[0])
        : 0;
      result.push({ camera: cam, alerts: [group.alert], distance: dist });
    }
  }

  return result;
}
