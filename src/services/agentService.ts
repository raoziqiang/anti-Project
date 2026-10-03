import { AgentNotification, ChatMessage, PetEmotion } from '../types';

type NotificationListener = (notification: AgentNotification) => void;
type EmotionListener = (emotion: PetEmotion) => void;
type MessageListener = (message: ChatMessage) => void;
type ConfigListener = (config: any) => void;

class AgentService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private notificationListeners: Set<NotificationListener> = new Set();
  private emotionListeners: Set<EmotionListener> = new Set();
  private messageListeners: Set<MessageListener> = new Set();
  private configListeners: Set<ConfigListener> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private port: number = 18989;

  constructor() {
    this.connect();
  }

  public setPort(port: number) {
    if (this.port !== port) {
      this.port = port;
      this.disconnect();
      this.connect();
    }
  }

  public getPort(): number {
    return this.port;
  }

  public isWsConnected(): boolean {
    return this.isConnected;
  }

  public connect() {
    if (typeof window === 'undefined') return;

    try {
      this.ws = new WebSocket(`ws://localhost:${this.port}/ws`);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log(`[AgentHub] Connected to Desktop Pet Gateway on port ${this.port}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data);
        } catch (err) {
          console.error('[AgentHub] Error parsing message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (e) {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 4000);
  }

  private handleIncomingEvent(data: {
    type: string;
    payload?: any;
  }) {
    switch (data.type) {
      case 'NOTIFICATION': {
        const notif: AgentNotification = {
          id: data.payload.id || `notif_${Date.now()}`,
          source: data.payload.source || 'External Agent',
          title: data.payload.title || 'Agent 任务提醒',
          message: data.payload.message || '',
          emotion: data.payload.emotion || 'happy',
          timestamp: Date.now(),
          duration: data.payload.duration || 6000,
          sound: data.payload.sound !== false
        };
        this.notificationListeners.forEach(listener => listener(notif));
        break;
      }
      case 'EMOTION': {
        if (data.payload?.emotion) {
          this.emotionListeners.forEach(listener => listener(data.payload.emotion));
        }
        break;
      }
      case 'MESSAGE': {
        const msg: ChatMessage = {
          id: `msg_${Date.now()}`,
          sender: 'agent',
          agentName: data.payload.agentName || 'Agent',
          content: data.payload.content || '',
          timestamp: Date.now(),
          emotion: data.payload.emotion || 'thinking',
          actionRequired: data.payload.actionRequired
        };
        this.messageListeners.forEach(listener => listener(msg));
        break;
      }
      case 'CONFIG_UPDATED': {
        if (data.payload) {
          this.configListeners.forEach(listener => listener(data.payload));
        }
        break;
      }
    }
  }

  /**
   * Send response back to agent when user answers a question / prompt
   */
  public async respondToAgent(callbackId: string, answer: string): Promise<boolean> {
    try {
      const res = await fetch(`http://localhost:${this.port}/api/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackId, answer })
      });
      return res.ok;
    } catch (err) {
      console.error('[AgentHub] Error responding to agent:', err);
      return false;
    }
  }

  // Subscribe methods
  public onNotification(listener: NotificationListener) {
    this.notificationListeners.add(listener);
    return () => { this.notificationListeners.delete(listener); };
  }

  public onEmotion(listener: EmotionListener) {
    this.emotionListeners.add(listener);
    return () => { this.emotionListeners.delete(listener); };
  }

  public onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => { this.messageListeners.delete(listener); };
  }

  public onConfigUpdated(listener: ConfigListener) {
    this.configListeners.add(listener);
    return () => { this.configListeners.delete(listener); };
  }
}

export const agentService = new AgentService();
