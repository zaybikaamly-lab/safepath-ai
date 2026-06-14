'use client';
import { WeatherData } from '@/types';

interface Props { weather: WeatherData }

export default function WeatherWidget({ weather }: Props) {
  const windDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const hasAlerts = weather.alerts.length > 0;
  const isRaining = weather.rainfall1h > 0 || weather.rainfall3h > 0;

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{
        background: hasAlerts ? '#FF444410' : '#0D1B2E',
        borderColor: hasAlerts ? '#FF444440' : '#1A2E4A',
        borderLeft: `3px solid ${hasAlerts ? '#FF4444' : '#00D4FF'}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-widest text-navy-400">LIVE CONDITIONS</div>
        <div className="font-mono text-[10px]" style={{ color: hasAlerts ? '#FF6666' : '#00D4FF' }}>
          {weather.city}, {weather.country}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="TEMP" value={`${weather.temperature.toFixed(0)}°C`} />
        <Stat label="WIND" value={`${weather.windSpeed.toFixed(0)}m/s ${windDir(weather.windDeg)}`} />
        <Stat label="HUMID" value={`${weather.humidity}%`} />
        {isRaining && <Stat label="RAIN/1H" value={`${weather.rainfall1h}mm`} color="#00D4FF" />}
        <Stat label="VIS" value={`${(weather.visibility / 1000).toFixed(1)}km`} />
        <Stat label="FEELS" value={`${weather.feelsLike.toFixed(0)}°C`} />
      </div>

      <div className="font-mono text-[11px] text-navy-300 capitalize">{weather.description}</div>

      {hasAlerts && (
        <div className="space-y-1">
          {weather.alerts.map((alert, i) => (
            <div key={i} className="font-mono text-[10px] text-hazard bg-hazard/10 rounded px-2 py-1 border border-hazard/20">
              ⚠ {alert.event}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="font-mono text-[8px] text-navy-600 tracking-widest">{label}</div>
      <div className="font-mono text-[12px] font-bold" style={{ color: color || '#C0D8F0' }}>{value}</div>
    </div>
  );
}
