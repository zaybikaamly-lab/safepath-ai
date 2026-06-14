import { WeatherData, WeatherAlert } from '@/types';

const BASE = 'https://api.openweathermap.org';

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error('Missing OPENWEATHER_API_KEY');

  // Step 1: geocode city
  const geoRes = await fetch(
    `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`
  );
  const geo = await geoRes.json();
  if (!geo.length) throw new Error(`City not found: ${city}`);
  const { lat, lon, name, country } = geo[0];

  return getWeatherByCoords(lat, lon, name, country);
}

export async function getWeatherByCoords(
  lat: number,
  lon: number,
  city?: string,
  country?: string
): Promise<WeatherData> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error('Missing OPENWEATHER_API_KEY');

  // Current weather
  const [currentRes, alertRes] = await Promise.all([
    fetch(`${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`),
    fetch(`${BASE}/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${key}&units=metric&exclude=minutely,hourly,daily`)
      .catch(() => null), // onecall requires paid plan — gracefully degrade
  ]);

  const current = await currentRes.json();

  let alerts: WeatherAlert[] = [];
  if (alertRes?.ok) {
    const oneCall = await alertRes.json();
    alerts = (oneCall.alerts || []).map((a: Record<string, unknown>) => ({
      event: a.event as string,
      description: (a.description as string).slice(0, 300),
      start: a.start as number,
      end: a.end as number,
    }));
  }

  return {
    city: city || current.name,
    country: country || current.sys?.country || '',
    temperature: current.main.temp,
    feelsLike: current.main.feels_like,
    humidity: current.main.humidity,
    windSpeed: current.wind?.speed || 0,
    windDeg: current.wind?.deg || 0,
    description: current.weather?.[0]?.description || '',
    icon: current.weather?.[0]?.icon || '',
    rainfall1h: current.rain?.['1h'] || 0,
    rainfall3h: current.rain?.['3h'] || 0,
    visibility: current.visibility || 10000,
    alerts,
    coordinates: { lat, lon },
    timestamp: Date.now(),
  };
}

export function weatherToPromptContext(w: WeatherData): string {
  const alertText = w.alerts.length
    ? `\nACTIVE ALERTS:\n${w.alerts.map(a => `- ${a.event}: ${a.description}`).join('\n')}`
    : '\nNo active official weather alerts.';

  return `
LIVE WEATHER DATA — ${w.city}, ${w.country} (as of ${new Date(w.timestamp).toUTCString()})
Temperature: ${w.temperature.toFixed(1)}°C (feels like ${w.feelsLike.toFixed(1)}°C)
Conditions: ${w.description}
Wind: ${w.windSpeed} m/s (${windDirection(w.windDeg)})
Humidity: ${w.humidity}%
Visibility: ${(w.visibility / 1000).toFixed(1)} km
Rainfall last hour: ${w.rainfall1h} mm
Rainfall last 3 hours: ${w.rainfall3h} mm
${alertText}
`.trim();
}

function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
