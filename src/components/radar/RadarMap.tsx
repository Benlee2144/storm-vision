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

export function RadarMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [frameTime, setFrameTime] = useState('');

  const { data: radarData } = useRadarFrames();
  const { data: alerts } = useNationalAlerts();
  const {
    playing, speed, currentFrame, opacity, showRadar, showAlerts,
    mapStyle, setCurrentFrame, setTotalFrames, setPlaying,
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
      maxZoom: 12,
      minZoom: 3,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add/update radar frames
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

    // Show first frame
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

  // Alert polygons
  useEffect(() => {
    if (!mapLoaded || !map.current || !alerts) return;
    const m = map.current;

    // Remove old alert layers
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
          type: 'Feature',
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geojson: any = { type: 'FeatureCollection', features };

    m.addSource('alerts-source', {
      type: 'geojson',
      data: geojson,
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

    // Click handler for alerts
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

      {/* Controls */}
      <RadarControls />
      <LayerPanel />

      {/* RainViewer credit */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-[var(--text-tertiary)]">
        Radar data by{' '}
        <a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer" className="underline">
          RainViewer
        </a>
      </div>
    </div>
  );
}
