import { BandClient, AGENTS } from '@/lib/api/band';
import { weatherToPromptContext } from '@/lib/api/weather';
import { WeatherData, CommunityReport, CoordinatorOutput, AgentMessage } from '@/types';

export async function runAgentsViaband(
  situation: string,
  weather: WeatherData,
  communityReports: CommunityReport[],
  onAgentMessage: (msg: AgentMessage) => void,
): Promise<{ result: unknown; messages: AgentMessage[] }> {
  const apiKey = process.env.BAND_API_KEY;
  const chatRoomId = process.env.BAND_CHAT_ROOM_ID;

  if (!apiKey || !chatRoomId) {
    throw new Error('Missing BAND_API_KEY or BAND_CHAT_ROOM_ID environment variables');
  }

  const band = new BandClient(apiKey, chatRoomId);
  const agentLog: AgentMessage[] = [];

  const track = (agent: string, message: string) => {
    const msg: AgentMessage = {
      agent: agent as any,
      message,
      timestamp: Date.now(),
    };
    agentLog.push(msg);
    onAgentMessage(msg);
  };

  // Build context for agents
  const weatherContext = weatherToPromptContext(weather);
  const reportContext = communityReports.length
    ? `Community reports: ${communityReports.map(r => `${r.type}: ${r.description}`).join('; ')}`
    : 'No community reports.';

  const fullContext = `
USER SITUATION: ${situation}

${weatherContext}

${reportContext}

DISASTER TYPE: [to be analyzed by agents]
SEVERITY: [to be analyzed by agents]

Please analyze this situation and provide recommendations.
`.trim();

  try {
    // Send initial message to trigger Hazard Agent
    track('system', 'AGENTS COORDINATING VIA BAND...');

    await band.sendMessage(
      `${fullContext}\n\nPlease analyze this situation.`,
      AGENTS.hazard.handle,
      AGENTS.hazard.name
    );

    track('hazard', 'Hazard Agent has been notified and is analyzing the situation');

    // Listen for responses via WebSocket
    const responses = await listenForAgentResponses(band, agentLog, onAgentMessage);

    track('system', 'COORDINATION COMPLETE');

    // Parse coordinator response if available
    let coordinatorMessage = responses.find(r => r.agent === 'coord')?.message || 'Analysis complete';

    return {
      result: {
        riskLevel: 'MODERATE',
        action: 'PREPARE',
        summary: coordinatorMessage,
        agentMessages: agentLog,
        // Placeholder - real implementation would parse agent responses
        hazard: { disasterType: 'Unknown', severity: 'MODERATE', risks: [], affectedAreas: [], weatherSummary: '', roadRiskZones: [] },
        safety: { evacuate: false, action: 'PREPARE', recommendations: [], dangerousActions: [], timeWindow: '' },
        shelter: { selected: { id: '', name: '', address: '', lat: 0, lon: 0, capacity: '', status: 'OPEN', petFriendly: false, medicalSupport: false }, alternatives: [], reason: '' },
        nav: { destination: '', destinationCoords: { lat: 0, lon: 0 }, routeCoords: [], steps: [], avoidZones: [], eta: '', distanceKm: 0, safetyNotes: [] },
        prep: { checklist: [] },
        whatIf: { scenarios: [] },
      },
      messages: agentLog,
    };
  } catch (err) {
    track('system', `ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw err;
  }
}

function listenForAgentResponses(
  band: BandClient,
  agentLog: AgentMessage[],
  onMessage: (msg: AgentMessage) => void,
  timeoutMs: number = 30000
): Promise<AgentMessage[]> {
  return new Promise((resolve, reject) => {
    const responses: AgentMessage[] = [];
    let wsConnected = false;
    const timeout = setTimeout(() => {
      ws.close();
      if (responses.length > 0) {
        resolve(responses);
      } else {
        reject(new Error('No agent responses received within timeout'));
      }
    }, timeoutMs);

    const ws = band.connectWebSocket((event: any) => {
      wsConnected = true;

      // Listen for message_created events
      if (event.type === 'message_created' && event.data?.sender) {
        const sender = event.data.sender.handle || event.data.sender.name;
        const content = event.data.content;

        // Determine which agent sent this
        let agentName = 'unknown';
        for (const [key, agent] of Object.entries(AGENTS)) {
          if (sender.includes(key) || agent.handle === sender) {
            agentName = key;
            break;
          }
        }

        const msg: AgentMessage = {
          agent: agentName as any,
          message: content.slice(0, 200),
          timestamp: Date.now(),
        };

        responses.push(msg);
        onMessage(msg);
      }

      // Check if coordinator has responded (end of sequence)
      if (event.type === 'message_created' && event.data?.sender?.handle?.includes('coordinator')) {
        setTimeout(() => {
          ws.close();
          clearTimeout(timeout);
          resolve(responses);
        }, 1000);
      }
    });

    // Fallback: close after timeout
    setTimeout(() => {
      if (wsConnected) {
        ws.close();
        clearTimeout(timeout);
        resolve(responses);
      }
    }, timeoutMs);
  });
}
