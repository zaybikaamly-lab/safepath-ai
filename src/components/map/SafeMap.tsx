'use client';
import { useEffect, useRef } from 'react';
import { NavOutput, Shelter } from '@/types';

interface Props {
  userLat: number;
  userLon: number;
  nav: NavOutput | null;
  shelters: Shelter[];
  selectedShelterId?: string;
}

export default function SafeMap({ userLat, userLon, nav, shelters, selectedShelterId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const layersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically import Leaflet (SSR safe)
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) return; // already initialized

      // Fix default marker icons for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [userLat, userLon],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers and route when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current as ReturnType<typeof L.map>;

      // Clear old layers
      layersRef.current.forEach(layer => map.removeLayer(layer as ReturnType<typeof L.marker>));
      layersRef.current = [];

      // User location marker
      const userIcon = L.divIcon({
        html: `<div style="
          width:16px;height:16px;
          background:#00D4FF;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 0 0 4px #00D4FF40;
        "></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const userMarker = L.marker([userLat, userLon], { icon: userIcon })
        .bindPopup('<b style="color:#00D4FF">You are here</b>')
        .addTo(map);
      layersRef.current.push(userMarker);

      // Shelter markers
      shelters.forEach((shelter) => {
        if (!shelter.lat || !shelter.lon) return;
        const isSelected = shelter.id === selectedShelterId;
        const shelterIcon = L.divIcon({
          html: `<div style="
            width:${isSelected ? 20 : 14}px;
            height:${isSelected ? 20 : 14}px;
            background:${isSelected ? '#00FF88' : '#FFD600'};
            border:3px solid #fff;
            border-radius:3px;
            box-shadow:0 0 0 3px ${isSelected ? '#00FF8840' : '#FFD60040'};
            display:flex;align-items:center;justify-content:center;
            font-size:8px;
          ">${isSelected ? '🏠' : '🏠'}</div>`,
          className: '',
          iconSize: [isSelected ? 20 : 14, isSelected ? 20 : 14],
          iconAnchor: [isSelected ? 10 : 7, isSelected ? 10 : 7],
        });

        const marker = L.marker([shelter.lat, shelter.lon], { icon: shelterIcon })
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:160px">
              <b style="color:${isSelected ? '#00FF88' : '#FFD600'}">${shelter.name}</b><br/>
              <span style="font-size:11px;color:#666">${shelter.address}</span><br/>
              <span style="font-size:11px">Cap: ${shelter.capacity} · ${shelter.status}</span><br/>
              ${shelter.petFriendly ? '<span style="font-size:11px">🐾 Pet-friendly</span><br/>' : ''}
              ${shelter.medicalSupport ? '<span style="font-size:11px">🏥 Medical support</span>' : ''}
            </div>
          `)
          .addTo(map);
        layersRef.current.push(marker);

        if (isSelected) marker.openPopup();
      });

      // Route polyline
      if (nav?.routeCoords?.length > 1) {
        const routeLine = L.polyline(nav.routeCoords, {
          color: '#00D4FF',
          weight: 4,
          opacity: 0.85,
          dashArray: undefined,
        }).addTo(map);
        layersRef.current.push(routeLine);

        // Fit map to route + some padding
        const bounds = L.latLngBounds([
          [userLat, userLon],
          [nav.destinationCoords.lat, nav.destinationCoords.lon],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.setView([userLat, userLon], 12);
      }

      // Hazard zone circles (soft red overlay near user for demo)
      if (nav?.avoidZones?.length) {
        const hazardCircle = L.circle([userLat, userLon], {
          radius: 1500,
          color: '#FF4444',
          fillColor: '#FF4444',
          fillOpacity: 0.08,
          weight: 1,
          dashArray: '6,4',
        }).bindTooltip('⚠ Hazard zone — avoid if possible', { permanent: false }).addTo(map);
        layersRef.current.push(hazardCircle);
      }
    });
  }, [userLat, userLon, nav, shelters, selectedShelterId]);

  return (
    <div className="relative w-full h-full">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full" />

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-navy-900/90 border border-navy-700 rounded-lg px-3 py-2 font-mono text-[10px] space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-DEFAULT border-2 border-white" />
          <span className="text-navy-300">Your location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-safe border-2 border-white" />
          <span className="text-navy-300">Primary shelter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warn border-2 border-white" />
          <span className="text-navy-300">Alternate shelter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 border-t-2 border-cyan-DEFAULT" />
          <span className="text-navy-300">Safe route</span>
        </div>
      </div>
    </div>
  );
}
