// Service WebSocket pour le chat temps réel et l'audio streaming
export interface WebSocketMessage {
  type: 'message' | 'audio' | 'typing' | 'error' | 'system';
  data: any;
  timestamp: number;
  userId?: string;
  conversationId?: string;
}
export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}
export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private isConnecting = false;
  private isManualClose = false;
  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
  }
  /**
   * Connecte au WebSocket
   */
  async connect(token?: string): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    this.isConnecting = true;
    this.isManualClose = false;
    try {
      const wsUrl = token
        ? `${this.config.url}?token=${encodeURIComponent(token)}`
        : this.config.url;
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        console.log('WebSocket connecté');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('system', { type: 'connected' });
      };
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };
      this.ws.onclose = (event) => {
        console.log('WebSocket fermé:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        if (!this.isManualClose && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect();
        }
        this.emit('system', {
          type: 'disconnected',
          code: event.code,
          reason: event.reason
        });
      };
      this.ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        this.isConnecting = false;
        this.emit('error', { error: 'Erreur de connexion WebSocket' });
      };
    } catch (error) {
      this.isConnecting = false;
      console.error('Erreur connexion WebSocket:', error);
      throw error;
    }
  }
  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1000, 'Fermeture manuelle');
      this.ws = null;
    }
  }
  /**
   * Envoie un message
   */
  send(type: string, data: any, conversationId?: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket non connecté');
    }
    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: Date.now(),
      conversationId,
    };
    this.ws.send(JSON.stringify(message));
  }
  /**
   * Envoie un message de chat
   */
  sendMessage(conversationId: string, content: string, audioData?: ArrayBuffer): void {
    this.send('message', {
      conversationId,
      content,
      audioData: audioData ? this.arrayBufferToBase64(audioData) : undefined,
    }, conversationId);
  }
  /**
   * Envoie un indicateur de frappe
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    this.send('typing', {
      conversationId,
      isTyping,
    }, conversationId);
  }
  /**
   * Envoie de l'audio en streaming
   */
  sendAudioChunk(conversationId: string, audioChunk: ArrayBuffer): void {
    this.send('audio', {
      conversationId,
      audioData: this.arrayBufferToBase64(audioChunk),
      isStreaming: true,
    }, conversationId);
  }
  /**
   * Ajoute un gestionnaire d'événements
   */
  on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  /**
   * Supprime un gestionnaire d'événements
   */
  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  /**
   * Émet un événement
   */
  private emit(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler({
            type: eventType as any,
            data,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Erreur handler WebSocket:', error);
        }
      });
    }
  }
  /**
   * Gère les messages reçus
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'message':
        this.emit('message', message.data);
        break;
      case 'audio':
        this.emit('audio', message.data);
        break;
      case 'typing':
        this.emit('typing', message.data);
        break;
      case 'error':
        this.emit('error', message.data);
        break;
      case 'system':
        this.emit('system', message.data);
        break;
      default:
        console.warn('Type de message WebSocket inconnu:', message.type);
    }
  }
  /**
   * Programme une reconnexion
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnexion WebSocket dans ${delay}ms (tentative ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  /**
   * Annule le timer de reconnexion
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  /**
   * Démarre le heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('system', { type: 'ping' });
      }
    }, this.config.heartbeatInterval!);
  }
  /**
   * Arrête le heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  /**
   * Convertit ArrayBuffer en base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  /**
   * Obtient le statut de la connexion
   */
  getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }
  /**
   * Vérifie si la connexion est active
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
// Factory function
export function createWebSocketService(): WebSocketService {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  return new WebSocketService({
    url: wsUrl,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
  });
}
// Instance singleton
export const webSocketService = createWebSocketService();
// Types d'export
export type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketEventHandler,
};