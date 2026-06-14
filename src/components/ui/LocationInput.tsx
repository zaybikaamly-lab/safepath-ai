'use client';
import { useState } from 'react';
import { UserLocation } from '@/types';

interface Props {
  onLocation: (loc: UserLocation) => void;
  isLoading: boolean;
}

export default function LocationInput({ onLocation, isLoading }: Props) {
  const [cityInput, setCityInput] = useState('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [mode, setMode] = useState<'geo' | 'city'>('geo');

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('idle');
        onLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          method: 'geolocation',
        });
      },
      () => {
        setGeoStatus('error');
      },
      { timeout: 10000 }
    );
  };

  const handleCitySearch = () => {
    if (!cityInput.trim()) return;
    onLocation({ lat: 0, lon: 0, city: cityInput.trim(), method: 'search' });
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-navy-700">
        <button
          onClick={() => setMode('geo')}
          className="flex-1 py-2 text-[11px] font-mono tracking-wider transition-all"
          style={{
            background: mode === 'geo' ? '#00D4FF20' : '#0D1B2E',
            color: mode === 'geo' ? '#00D4FF' : '#3A5A7A',
            borderRight: '1px solid #1A2E4A',
          }}
        >
          📍 USE MY LOCATION
        </button>
        <button
          onClick={() => setMode('city')}
          className="flex-1 py-2 text-[11px] font-mono tracking-wider transition-all"
          style={{
            background: mode === 'city' ? '#00D4FF20' : '#0D1B2E',
            color: mode === 'city' ? '#00D4FF' : '#3A5A7A',
          }}
        >
          🔍 SEARCH CITY
        </button>
      </div>

      {mode === 'geo' ? (
        <button
          onClick={handleGeolocate}
          disabled={geoStatus === 'loading' || isLoading}
          className="w-full py-3 rounded-lg font-mono text-[11px] tracking-widest transition-all border"
          style={{
            background: geoStatus === 'loading' ? '#0D1B2E' : '#00D4FF18',
            borderColor: geoStatus === 'loading' ? '#1A2E4A' : '#00D4FF40',
            color: geoStatus === 'loading' ? '#3A5A7A' : '#00D4FF',
            cursor: geoStatus === 'loading' ? 'wait' : 'pointer',
          }}
        >
          {geoStatus === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin-slow">◌</span> ACQUIRING LOCATION…
            </span>
          ) : geoStatus === 'error' ? (
            '⚠ Location denied — try city search'
          ) : (
            'DETECT MY LOCATION'
          )}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
            placeholder="e.g. Miami, FL or Houston, TX"
            className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-[13px] text-navy-100 outline-none transition-all placeholder:text-navy-600 font-mono"
            onFocus={(e) => (e.target.style.borderColor = '#00D4FF')}
            onBlur={(e) => (e.target.style.borderColor = '#1A2E4A')}
          />
          <button
            onClick={handleCitySearch}
            disabled={!cityInput.trim() || isLoading}
            className="px-4 py-2 rounded-lg font-mono text-[11px] tracking-wider transition-all"
            style={{
              background: cityInput.trim() ? '#00D4FF20' : '#0D1B2E',
              border: `1px solid ${cityInput.trim() ? '#00D4FF40' : '#1A2E4A'}`,
              color: cityInput.trim() ? '#00D4FF' : '#3A5A7A',
              cursor: cityInput.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            SET
          </button>
        </div>
      )}
    </div>
  );
}
