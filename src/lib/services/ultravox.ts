// Service d'intégration Ultravox pour l'IA vocale temps réel
export interface UltravoxConfig {
  apiKey: string;
  apiUrl: string;
  model?: string;
  language?: string;
}
export interface AudioTranscription {
  text: string;
  confidence: number;
  duration: number;
  language: string;
  timestamps?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}
export interface VoiceSynthesis {
  audioUrl: string;
  duration: number;
  format: string;
  sampleRate: number;
}
export interface UltravoxSession {
  sessionId: string;
  status: 'active' | 'inactive' | 'error';
  websocketUrl?: string;
}
export class UltravoxService {
  private config: UltravoxConfig;
  private websocket: WebSocket | null = null;
  private currentSession: UltravoxSession | null = null;
  constructor(config: UltravoxConfig) {
    this.config = {
      model: 'ultravox-v0_3',
      language: 'fr-FR',
      ...config,
    };
  }
  /**
   * Initialise une session Ultravox
   */
  async createSession(): Promise<UltravoxSession> {
    try {
      const response = await fetch(`${this.config.apiUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          language: this.config.language,
          systemPrompt: `Tu es un assistant IA coopératif pour VoiceCoop.
                        Tu aides les utilisateurs avec leurs questions sur l'IA vocale,
                        la gouvernance coopérative et les fonctionnalités de la plateforme.
                        Sois concis, utile et bienveillant.`,
        }),
      });
      if (!response.ok) {
        throw new Error(`Erreur API Ultravox: ${response.status}`);
      }
      const session = await response.json();
      this.currentSession = {
        sessionId: session.sessionId,
        status: 'active',
        websocketUrl: session.websocketUrl,
      };
      return this.currentSession;
    } catch (error) {
      console.error('Erreur création session Ultravox:', error);
      throw new Error('Impossible de créer une session vocale');
    }
  }
  /**
   * Connecte au WebSocket pour le streaming temps réel
   */
  async connectWebSocket(
    onMessage: (data: any) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.currentSession?.websocketUrl) {
      throw new Error('Aucune session active');
    }
    try {
      this.websocket = new WebSocket(this.currentSession.websocketUrl);
      this.websocket.onopen = () => {
        console.log('WebSocket Ultravox connecté');
      };
      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };
      this.websocket.onerror = (event) => {
        console.error('Erreur WebSocket Ultravox:', event);
        onError(new Error('Erreur de connexion WebSocket'));
      };
      this.websocket.onclose = () => {
        console.log('WebSocket Ultravox fermé');
        this.websocket = null;
      };
    } catch (error) {
      console.error('Erreur connexion WebSocket:', error);
      throw new Error('Impossible de se connecter au service vocal');
    }
  }
  /**
   * Envoie de l'audio au service
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket non connecté');
    }
    try {
      // Convertir l'audio en base64 pour l'envoi
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      const message = {
        type: 'audio',
        data: base64Audio,
        timestamp: Date.now(),
      };
      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Erreur envoi audio:', error);
      throw new Error('Erreur lors de l\'envoi de l\'audio');
    }
  }
  /**
   * Transcription audio (mode batch)
   */
  async transcribeAudio(audioBlob: Blob): Promise<AudioTranscription> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('model', this.config.model || 'ultravox-v0_3');
      formData.append('language', this.config.language || 'fr-FR');
      const response = await fetch(`${this.config.apiUrl}/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Erreur transcription: ${response.status}`);
      }
      const result = await response.json();
      return {
        text: result.text,
        confidence: result.confidence || 0.85,
        duration: result.duration || 0,
        language: result.language || this.config.language || 'fr-FR',
        timestamps: result.timestamps,
      };
    } catch (error) {
      console.error('Erreur transcription Ultravox:', error);
      throw new Error('Erreur lors de la transcription audio');
    }
  }
  /**
   * Synthèse vocale (Text-to-Speech)
   */
  async synthesizeVoice(
    text: string,
    voice: string = 'fr-FR-Neural2-A'
  ): Promise<VoiceSynthesis> {
    try {
      const response = await fetch(`${this.config.apiUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          format: 'mp3',
          sampleRate: 24000,
        }),
      });
      if (!response.ok) {
        throw new Error(`Erreur synthèse vocale: ${response.status}`);
      }
      const result = await response.json();
      return {
        audioUrl: result.audioUrl,
        duration: result.duration || 0,
        format: result.format || 'mp3',
        sampleRate: result.sampleRate || 24000,
      };
    } catch (error) {
      console.error('Erreur synthèse Ultravox:', error);
      throw new Error('Erreur lors de la synthèse vocale');
    }
  }
  /**
   * Ferme la session et nettoie les ressources
   */
  async closeSession(): Promise<void> {
    try {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      if (this.currentSession) {
        await fetch(`${this.config.apiUrl}/sessions/${this.currentSession.sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        });
        this.currentSession = null;
      }
    } catch (error) {
      console.error('Erreur fermeture session Ultravox:', error);
    }
  }
  /**
   * Obtient le statut de la session actuelle
   */
  getSessionStatus(): UltravoxSession | null {
    return this.currentSession;
  }
  /**
   * Vérifie si le service est disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur health check Ultravox:', error);
      return false;
    }
  }
}
// Factory function pour créer une instance
export function createUltravoxService(): UltravoxService {
  const config: UltravoxConfig = {
    apiKey: process.env.ULTRAVOX_API_KEY || '',
    apiUrl: process.env.ULTRAVOX_API_URL || 'https://api.ultravox.ai/v1',
  };
  if (!config.apiKey) {
    console.warn('ULTRAVOX_API_KEY non configurée - mode simulation');
  }
  return new UltravoxService(config);
}
// Instance singleton
export const ultravoxService = createUltravoxService();
// Types d'export
export type {
  UltravoxConfig,
  AudioTranscription,
  VoiceSynthesis,
  UltravoxSession,
};