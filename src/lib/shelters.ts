import { Shelter } from '@/types';

export const SHELTERS: Shelter[] = [
  // Miami
  {
    id: 'mia-1',
    name: 'Miami-Dade Emergency Shelter — FIU Campus',
    address: '11200 SW 8th St, Miami, FL 33199',
    lat: 25.7573, lon: -80.3741,
    capacity: '2,500', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  {
    id: 'mia-2',
    name: 'Tropical Park Emergency Center',
    address: '7900 SW 40th St, Miami, FL 33155',
    lat: 25.7399, lon: -80.3321,
    capacity: '1,000', status: 'OPEN',
    petFriendly: true, medicalSupport: false,
  },
  {
    id: 'mia-3',
    name: 'AmericanAirlines Arena Shelter',
    address: '601 Biscayne Blvd, Miami, FL 33132',
    lat: 25.7814, lon: -80.1870,
    capacity: '3,000', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  // New York
  {
    id: 'nyc-1',
    name: 'Red Cross Manhattan Shelter — Javits Center',
    address: '429 11th Ave, New York, NY 10001',
    lat: 40.7574, lon: -74.0021,
    capacity: '5,000', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  {
    id: 'nyc-2',
    name: 'Brooklyn Emergency Shelter — Marine Park',
    address: '3301 Avenue S, Brooklyn, NY 11234',
    lat: 40.5976, lon: -73.9309,
    capacity: '800', status: 'OPEN',
    petFriendly: true, medicalSupport: false,
  },
  // Houston
  {
    id: 'hou-1',
    name: 'George R. Brown Convention Center',
    address: '1001 Avenida De Las Americas, Houston, TX 77010',
    lat: 29.7534, lon: -95.3594,
    capacity: '10,000', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  {
    id: 'hou-2',
    name: 'NRG Center Emergency Shelter',
    address: '1 NRG Pkwy, Houston, TX 77054',
    lat: 29.6847, lon: -95.4105,
    capacity: '4,000', status: 'OPEN',
    petFriendly: true, medicalSupport: true,
  },
  // Los Angeles
  {
    id: 'lax-1',
    name: 'Los Angeles Convention Center',
    address: '1201 S Figueroa St, Los Angeles, CA 90015',
    lat: 34.0401, lon: -118.2697,
    capacity: '8,000', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  {
    id: 'lax-2',
    name: 'Pomona Fairplex Emergency Shelter',
    address: '1101 W McKinley Ave, Pomona, CA 91768',
    lat: 34.0561, lon: -117.7626,
    capacity: '3,500', status: 'OPEN',
    petFriendly: true, medicalSupport: false,
  },
  // San Francisco
  {
    id: 'sfo-1',
    name: 'Moscone Center Emergency Shelter',
    address: '747 Howard St, San Francisco, CA 94103',
    lat: 37.7840, lon: -122.4009,
    capacity: '4,000', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  {
    id: 'sfo-2',
    name: 'Cow Palace Arena Shelter',
    address: '2600 Geneva Ave, Daly City, CA 94014',
    lat: 37.7084, lon: -122.4592,
    capacity: '2,000', status: 'OPEN',
    petFriendly: true, medicalSupport: false,
  },
  // Austin
  {
    id: 'aus-1',
    name: 'Austin Convention Center',
    address: '500 E Cesar Chavez St, Austin, TX 78701',
    lat: 30.2624, lon: -97.7405,
    capacity: '3,000', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
  {
    id: 'aus-2',
    name: 'Travis County Exposition Center',
    address: '7311 Decker Ln, Austin, TX 78724',
    lat: 30.2919, lon: -97.6358,
    capacity: '1,500', status: 'OPEN',
    petFriendly: true, medicalSupport: false,
  },
  // Generic fallback shelters (used when city not matched)
  {
    id: 'gen-1',
    name: 'Regional Emergency Management Center',
    address: 'Contact local authorities for address',
    lat: 0, lon: 0,
    capacity: '500', status: 'OPEN',
    petFriendly: false, medicalSupport: true,
  },
];

export function getSheltersNear(lat: number, lon: number, radiusKm = 50): Shelter[] {
  function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  return SHELTERS
    .filter(s => s.lat !== 0)
    .map(s => ({ ...s, distanceKm: distKm({ lat, lon }, s) }))
    .filter(s => s.distanceKm! <= radiusKm)
    .sort((a, b) => a.distanceKm! - b.distanceKm!)
    .slice(0, 5);
}
