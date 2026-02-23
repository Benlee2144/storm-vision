'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRadarFrames } from '@/hooks/useRadarFrames';
import { useRadarStore } from '@/stores/useRadarStore';
import { useNationalAlerts } from '@/hooks/useAlerts';
import { getAlertConfig } from '@/lib/constants/alert-types';
import { formatRadarTime } from '@/lib/api/rainviewer';
import { RadarControls } from './RadarControls';
import { LayerPanel } from './LayerPanel';

const MAP_STYLES: Record<string, string> = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/liberty',
  satellite: 'https://tiles.openfreemap.org/styles/liberty',
  terrain: 'https://tiles.openfreemap.org/styles/liberty',
};

// Detect basePath for GitHub Pages
function getBase() {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/([^/]+)\//);
  return match ? `/${match[1]}` : '';
}

export function RadarMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [frameTime, setFrameTime] = useState('');
  const camerasLoadedRef = useRef(false);

  const { data: radarData } = useRadarFrames();
  const { data: alerts } = useNationalAlerts();
  const {
    playing, speed, currentFrame, opacity, showRadar, showAlerts, showCameras,
    mapStyle, setCurrentFrame, setTotalFrames,
  } = useRadarStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyle] || MAP_STYLES.dark,
      center: [-98.5, 39.5],
      zoom: 4,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 3,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => setMapLoaded(true));

    return () => {
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ALL CAMERAS as GeoJSON circle layer (62K+ points) ──
  useEffect(() => {
    if (!mapLoaded || !map.current || camerasLoadedRef.current) return;
    const m = map.current;

    const base = getBase();
    fetch(`${base}/data/cameras/markers.json`)
      .then((r) => r.json())
      .then((markers: Array<{ i: string; n: string; a: number; o: number; s: string; c: string }>) => {
        if (!m || m._removed) return;

        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: markers.map((mk) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [mk.o, mk.a] },
            properties: { id: mk.i, name: mk.n, state: mk.s, cat: mk.c },
          })),
        };

        m.addSource('all-cameras', { type: 'geojson', data: geojson });

        // Circles — scale with zoom
        m.addLayer({
          id: 'cameras-circle',
          type: 'circle',
          source: 'all-cameras',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              3, 1.5,
              6, 3,
              9, 5,
              12, 8,
              15, 12,
            ],
            'circle-color': '#00d4ff',
            'circle-opacity': [
              'interpolate', ['linear'], ['zoom'],
              3, 0.4,
              6, 0.6,
              9, 0.8,
              12, 1,
            ],
            'circle-stroke-width': [
              'interpolate', ['linear'], ['zoom'],
              3, 0,
              8, 1,
              12, 1.5,
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.6,
          },
        });

        // Click → popup with camera info + link to stream
        m.on('click', 'cameras-circle', (e) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties!;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];

          // Build stream URL (camera detail page)
          const camUrl = `${base}/cameras/${encodeURIComponent(props.id)}/`;

          new maplibregl.Popup({ offset: 12, maxWidth: '260px' })
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:system-ui,sans-serif;">
                <strong style="font-size:13px;color:#00d4ff;">${props.name}</strong>
                <p style="font-size:11px;opacity:0.7;margin:2px 0 6px;">${props.state}</p>
                <a href="${camUrl}" style="display:inline-block;padding:4px 10px;background:#00d4ff;color:#000;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">
                  ▶ Watch Live
                </a>
              </div>
            `)
            .addTo(m);
        });

        m.on('mouseenter', 'cameras-circle', () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', 'cameras-circle', () => { m.getCanvas().style.cursor = ''; });

        camerasLoadedRef.current = true;
        console.log(`[RadarMap] Loaded ${markers.length} camera markers`);
      })
      .catch((err) => console.warn('[RadarMap] Failed to load camera markers:', err));
  }, [mapLoaded]);

  // Toggle camera layer visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;
    if (m.getLayer('cameras-circle')) {
      m.setLayoutProperty('cameras-circle', 'visibility', showCameras ? 'visible' : 'none');
    }
  }, [showCameras, mapLoaded]);

  // ── RADAR FRAMES ──
  useEffect(() => {
    if (!mapLoaded || !map.current || !radarData) return;
    const m = map.current;
    const allFrames = [...radarData.radar.past, ...radarData.radar.nowcast];
    setTotalFrames(allFrames.length);

    // Remove old radar layers
    allFrames.forEach((_, i) => {
      const layerId = `radar-frame-${i}`;
      if (m.getLayer(layerId)) m.removeLayer(layerId);
      if (m.getSource(layerId)) m.removeSource(layerId);
    });

    // Add new frame sources and layers
    allFrames.forEach((frame, i) => {
      const sourceId = `radar-frame-${i}`;
      const tileUrl = `${radarData.host}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`;

      m.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        // @ts-expect-error - MapLibre supports this but types are incomplete
        crossOrigin: null,
      });

      m.addLayer({
        id: sourceId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': 0,
          'raster-opacity-transition': { duration: 0 },
        },
      });
    });

    // Ensure camera layer stays on top of radar
    if (m.getLayer('cameras-circle')) {
      m.moveLayer('cameras-circle');
    }

    if (allFrames.length > 0) {
      setCurrentFrame(allFrames.length - 1);
    }
  }, [mapLoaded, radarData, setCurrentFrame, setTotalFrames]);

  // Update visible frame
  const showFrame = useCallback((frameIndex: number) => {
    if (!map.current || !radarData) return;
    const m = map.current;
    const allFrames = [...radarData.radar.past, ...radarData.radar.nowcast];

    allFrames.forEach((_, i) => {
      const layerId = `radar-frame-${i}`;
      if (m.getLayer(layerId)) {
        m.setPaintProperty(layerId, 'raster-opacity',
          i === frameIndex ? (showRadar ? opacity : 0) : 0
        );
      }
    });

    if (allFrames[frameIndex]) {
      setFrameTime(formatRadarTime(allFrames[frameIndex].time));
    }
  }, [radarData, opacity, showRadar]);

  useEffect(() => {
    showFrame(currentFrame);
  }, [currentFrame, showFrame]);

  // Animation loop
  useEffect(() => {
    if (!playing || !radarData) return;
    const allFrames = [...radarData.radar.past, ...radarData.radar.nowcast];
    if (allFrames.length === 0) return;

    let frame = currentFrame;
    const animate = () => {
      frame = (frame + 1) % allFrames.length;
      setCurrentFrame(frame);
    };

    animRef.current = setInterval(animate, speed);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [playing, speed, radarData, setCurrentFrame, currentFrame]);

  // ── ALERT POLYGONS ──
  useEffect(() => {
    if (!mapLoaded || !map.current || !alerts) return;
    const m = map.current;

    if (m.getSource('alerts-source')) {
      if (m.getLayer('alerts-fill')) m.removeLayer('alerts-fill');
      if (m.getLayer('alerts-outline')) m.removeLayer('alerts-outline');
      m.removeSource('alerts-source');
    }

    if (!showAlerts) return;

    const features = alerts
      .filter((a) => a.geometry)
      .map((a) => {
        const config = getAlertConfig(a.properties.event);
        return {
          type: 'Feature' as const,
          geometry: a.geometry,
          properties: {
            event: a.properties.event,
            severity: a.properties.severity,
            color: config.color,
            fillColor: config.bgColor,
            headline: a.properties.headline || a.properties.event,
          },
        };
      });

    if (features.length === 0) return;

    m.addSource('alerts-source', {
      type: 'geojson',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { type: 'FeatureCollection', features } as any,
    });

    m.addLayer({
      id: 'alerts-fill',
      type: 'fill',
      source: 'alerts-source',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.15,
      },
    });

    m.addLayer({
      id: 'alerts-outline',
      type: 'line',
      source: 'alerts-source',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });

    // Keep cameras on top of alerts
    if (m.getLayer('cameras-circle')) {
      m.moveLayer('cameras-circle');
    }

    m.on('click', 'alerts-fill', (e) => {
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="max-width:250px;">
              <strong style="color:${props?.color}">${props?.event}</strong>
              <p style="font-size:12px;margin-top:4px;opacity:0.8;">${props?.headline}</p>
            </div>
          `)
          .addTo(m);
      }
    });

    m.on('mouseenter', 'alerts-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
    m.on('mouseleave', 'alerts-fill', () => { m.getCanvas().style.cursor = ''; });

  }, [mapLoaded, alerts, showAlerts]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Frame timestamp */}
      {frameTime && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full glass text-sm data-mono">
          {frameTime}
          {radarData && currentFrame >= radarData.radar.past.length && (
            <span className="ml-2 text-[var(--primary)] text-xs font-semibold">FORECAST</span>
          )}
        </div>
      )}

      <RadarControls />
      <LayerPanel />

      {/* Credits */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-[var(--text-tertiary)]">
        Radar:{' '}
        <a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer" className="underline">
          RainViewer
        </a>
        {' · Cameras: '}
        <a href="https://opencctv.org" target="_blank" rel="noopener noreferrer" className="underline">
          OpenCCTV
        </a>
      </div>
    </div>
  );
}
