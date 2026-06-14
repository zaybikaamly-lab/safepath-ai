import { NextRequest, NextResponse } from 'next/server';
import { getWeatherByCity, getWeatherByCoords } from '@/lib/api/weather';
import { runAgentsViaband } from '@/lib/agents/band-orchestrator';
import { CommunityReport } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { situation, city, lat, lon, communityReports = [] } = body;

    if (!situation) {
      return NextResponse.json({ error: 'situation is required' }, { status: 400 });
    }

    let weather;
    if (lat && lon) {
      weather = await getWeatherByCoords(Number(lat), Number(lon), city);
    } else if (city) {
      weather = await getWeatherByCity(city);
    } else {
      return NextResponse.json({ error: 'Provide city or coordinates' }, { status: 400 });
    }

    const { result } = await runAgentsViaband(
      situation,
      weather,
      communityReports as CommunityReport[],
      () => {}, // onAgentMessage callback
    );

    return NextResponse.json({ result, weather });
  } catch (err) {
    console.error('Analysis error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
