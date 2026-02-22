'use client';
import { useState, useEffect, useCallback } from 'react';
import type { CameraData } from '@/components/cameras/CameraCard';

// Detect basePath from current page URL for GitHub Pages compatibility
let _base: string | null = null;
function getBase() {
  if (_base) return _base;
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/([^/]+)\//);
    _base = match ? `/${match[1]}/data/cameras` : '/data/cameras';
  } else {
    _base = '/data/cameras';
  }
  return _base;
}

interface CameraIndex {
  total: number;
  states: Record<string, { count: number; file: string }>;
}

interface CameraMarker {
  i: string; // id
  n: string; // name
  a: number; // latitude
  o: number; // longitude
  s: string; // stateCode
  c: string; // category first char
}

let indexCache: CameraIndex | null = null;
let markersCache: CameraMarker[] | null = null;
const stateCache: Record<string, CameraData[]> = {};

export function useCameraIndex() {
  const [data, setData] = useState<CameraIndex | null>(indexCache);
  const [loading, setLoading] = useState(!indexCache);

  useEffect(() => {
    if (indexCache) return;
    fetch(`${getBase()}/index.json`)
      .then((r) => r.json())
      .then((d: CameraIndex) => {
        indexCache = d;
        setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useCameraMarkers() {
  const [data, setData] = useState<CameraMarker[] | null>(markersCache);
  const [loading, setLoading] = useState(!markersCache);

  useEffect(() => {
    if (markersCache) return;
    fetch(`${getBase()}/markers.json`)
      .then((r) => r.json())
      .then((d: CameraMarker[]) => {
        markersCache = d;
        setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useStateCameras(stateCode: string | undefined) {
  const code = stateCode?.toUpperCase();
  const [data, setData] = useState<CameraData[]>(code && stateCache[code] ? stateCache[code] : []);
  const [loading, setLoading] = useState<boolean>(!!code && !stateCache[code!]);

  useEffect(() => {
    if (!code) return;
    if (stateCache[code]) {
      setData(stateCache[code]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${getBase()}/${code.toLowerCase()}.json`)
      .then((r) => r.json())
      .then((d: CameraData[]) => {
        stateCache[code] = d;
        setData(d);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [code]);

  return { data, loading };
}

export function useCameraById(id: string | undefined) {
  const [camera, setCamera] = useState<CameraData | null>(null);
  const [nearby, setNearby] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    async function find() {
      // First check markers to find the state
      let markers = markersCache;
      if (!markers) {
        try {
          const r = await fetch(`${getBase()}/markers.json`);
          markers = await r.json();
          markersCache = markers;
        } catch { setLoading(false); return; }
      }

      const marker = markers!.find((m) => m.i === id);
      if (!marker) { setLoading(false); return; }

      const stateCode = marker.s;
      let stateCams = stateCache[stateCode];
      if (!stateCams) {
        try {
          const r = await fetch(`${getBase()}/${stateCode.toLowerCase()}.json`);
          stateCams = await r.json();
          stateCache[stateCode] = stateCams;
        } catch { setLoading(false); return; }
      }

      const found = stateCams.find((c) => c.id === id) || null;
      setCamera(found);
      if (found) {
        setNearby(stateCams.filter((c) => c.id !== id).slice(0, 4));
      }
      setLoading(false);
    }

    find();
  }, [id]);

  return { camera, nearby, loading };
}

/** Load cameras for multiple states (used by storm cams matching) */
export async function fetchCamerasForStates(stateCodes: string[]): Promise<CameraData[]> {
  const results: CameraData[] = [];
  await Promise.all(
    stateCodes.map(async (code) => {
      if (stateCache[code]) {
        results.push(...stateCache[code]);
        return;
      }
      try {
        const r = await fetch(`${getBase()}/${code.toLowerCase()}.json`);
        const data: CameraData[] = await r.json();
        stateCache[code] = data;
        results.push(...data);
      } catch {}
    })
  );
  return results;
}
