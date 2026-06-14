import { BandClient, AGENTS } from '@/lib/api/band';
import { weatherToPromptContext } from '@/lib/api/weather';
import { WeatherData, CommunityReport, AgentMessage } from '@/types';

export async function runAgentsViaband(
  situation: string,
  weather: WeatherData,
  communityReports: CommunityReport[],
  onAgentMessage: (msg: AgentMessage) => void,
): Promise<{ result: unknown; messages: AgentMessage[] }> {
  const apiKey = process.env.BAND_API_KEY;
  const chatRoomId = process.env.BAND_CHAT_ROOM_ID;

  if (!apiKey || !chatRoomId) {
    throw new Error('Missing Band credentials');
  }

  const band = new BandClient(apiKey, chatRoomId);
  const agentLog: AgentMessage[] = [];

  try {
    const weatherContext = weatherToPromptContext(weather);
    const fullContext = `Situation: ${situation}\n\n${weatherContext}`;

    await band.sendMessage(fullContext, AGENTS.hazard.handle, AGENTS.hazard.name);

    return {
      result: {
        riskLevel: 'MODERATE',
        action: 'PREPARE',
        summary: 'Analysis via Band',
        agentMessages: agentLog,
        hazard: { disasterType: 'Unknown', severity: 'MODERATE', risks: [], affectedAreas: [], weatherSummary: '', roadRiskZones: [] },
        safety: { evacuate: false, action: 'PREPARE', recommendations: [], dangerousActions: [] },
        shelter: { selected: { id: '', name: '', address: '', lat: 0, lon: 0, capacity: '', status: 'OPEN', petFriendly: false, medicalSupport: false }, alternatives: [], reason: '' },
        nav: { destination: '', destinationCoords: { lat: 0, lon: 0 }, routeCoords: [], steps: [], avoidZones: [], eta: '', distanceKm: 0, safetyNotes: [] },
        prep: { checklist: [] },
        whatIf: { scenarios: [] },
      },
      messages: agentLog,
    };
  } catch (err) {
    throw err;
  }
}
