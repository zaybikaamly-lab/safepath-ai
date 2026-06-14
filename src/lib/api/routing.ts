export interface OSRMRoute {
  coords: [number, number][];   // [lat, lon] pairs for Leaflet
  distanceKm: number;
  durationMin: number;
  steps: string[];
}

export async function getRoute(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number
): Promise<OSRMRoute> {
  // OSRM public API — free, no key needed
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLon},${fromLat};${toLon},${toLat}` +
    `?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('OSRM routing failed');
  }

  const route = data.routes[0];
  const coords: [number, number][] = route.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => [lat, lon]
  );

  const steps: string[] = [];
  for (const leg of route.legs) {
    for (const step of leg.steps) {
      const maneuver = step.maneuver?.type;
      const modifier = step.maneuver?.modifier;
      const name = step.name || 'unnamed road';
      const dist = (step.distance / 1000).toFixed(1);

      if (maneuver === 'depart') steps.push(`Start on ${name}`);
      else if (maneuver === 'arrive') steps.push(`Arrive at destination`);
      else if (modifier) steps.push(`${capitalize(modifier)} onto ${name} (${dist} km)`);
      else steps.push(`Continue on ${name} (${dist} km)`);
    }
  }

  return {
    coords,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    steps: steps.slice(0, 12), // cap for readability
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
