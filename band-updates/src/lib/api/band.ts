import { AgentMessage } from '@/types';

const BASE_URL = 'https://app.band.ai/api/v1/agent';
const WEBSOCKET_URL = 'wss://app.band.ai/api/v1/socket/websocket';

const AGENT_HANDLES = {
  hazard: '@emailzarayb/hazard-agent',
  safety: '@emailzarayb/safety-agent',
  shelter: '@emailzarayb/shelter-agent',
  nav: '@emailzarayb/navigation-agent',
  prep: '@emailzarayb/preparation-agent',
  whatif: '@emailzarayb/what-if-agent',
  coord: '@emailzarayb/coordinator-agent',
};

const AGENT_IDS = {
  hazard: '759c6c0b-7e41-4151-8cce-6f449562260a',
  safety: '9df5a71f-9d15-402a-a773-e5284699b81f',
  shelter: '7c859d9b-1e7c-46f7-909e-084cdbb9c860',
  nav: '09b7bb19-8291-4347-bf99-692f5d6661ef',
  prep: '7df1d0f9-7175-4305-8907-02b6c223fca4',
  whatif: 'afeef1ed-abdb-4756-bfe8-eadc0cf0efdc',
  coord: 'd16dc67a-9059-4d59-a0f8-a596e14ec136',
};

export class BandClient {
  private apiKey: string;
  private chatRoomId: string;

  constructor(apiKey: string, chatRoomId: string) {
    this.apiKey = apiKey;
    this.chatRoomId = chatRoomId;
  }

  private async request(method: string, endpoint: string, body?: unknown) {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Band API error: ${res.status} ${error}`);
    }

    return res.status === 204 ? null : await res.json();
  }

  async sendMessage(content: string, mentionHandle: string, mentionName: string) {
    const mentionId = Object.entries(AGENT_IDS).find(
      ([, id]) => AGENT_HANDLES[id as keyof typeof AGENT_HANDLES] === mentionHandle
    )?.[1];

    if (!mentionId) throw new Error(`Unknown agent handle: ${mentionHandle}`);

    return this.request('POST', `/chats/${this.chatRoomId}/messages`, {
      message: {
        content,
        mentions: [{ id: mentionId, name: mentionName, handle: mentionHandle }],
      },
    });
  }

  async postEvent(
    type: 'tool_call' | 'tool_result' | 'thought' | 'error',
    content: string,
    metadata?: unknown
  ) {
    return this.request('POST', `/chats/${this.chatRoomId}/events`, {
      event: {
        content,
        message_type: type,
        metadata,
      },
    });
  }

  async getMessages(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request('GET', `/chats/${this.chatRoomId}/messages${query}`);
  }

  async markProcessing(messageId: string) {
    return this.request('POST', `/chats/${this.chatRoomId}/messages/${messageId}/processing`);
  }

  async markProcessed(messageId: string) {
    return this.request('POST', `/chats/${this.chatRoomId}/messages/${messageId}/processed`);
  }

  async markFailed(messageId: string, error: string) {
    return this.request('POST', `/chats/${this.chatRoomId}/messages/${messageId}/failed`, {
      error,
    });
  }

  async getContext() {
    return this.request('GET', `/chats/${this.chatRoomId}/context`);
  }

  async getParticipants() {
    return this.request('GET', `/chats/${this.chatRoomId}/participants`);
  }

  connectWebSocket(onMessage: (event: unknown) => void): WebSocket {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      // Subscribe to chat room
      ws.send(
        JSON.stringify({
          action: 'subscribe',
          channels: [`chat_room:${this.chatRoomId}`],
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    return ws;
  }
}

export const AGENTS = {
  hazard: { handle: AGENT_HANDLES.hazard, id: AGENT_IDS.hazard, name: 'Hazard Agent' },
  safety: { handle: AGENT_HANDLES.safety, id: AGENT_IDS.safety, name: 'Safety Agent' },
  shelter: { handle: AGENT_HANDLES.shelter, id: AGENT_IDS.shelter, name: 'Shelter Agent' },
  nav: { handle: AGENT_HANDLES.nav, id: AGENT_IDS.nav, name: 'Navigation Agent' },
  prep: { handle: AGENT_HANDLES.prep, id: AGENT_IDS.prep, name: 'Preparation Agent' },
  whatif: { handle: AGENT_HANDLES.whatif, id: AGENT_IDS.whatif, name: 'What-If Agent' },
  coord: { handle: AGENT_HANDLES.coord, id: AGENT_IDS.coord, name: 'Coordinator Agent' },
};
