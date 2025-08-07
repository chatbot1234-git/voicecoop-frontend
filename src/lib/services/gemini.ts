import { GoogleGenerativeAI } from '@google/generative-ai';
// Configuration Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
export interface GeminiResponse {
  text: string;
  tokensUsed?: number;
  confidence?: number;
  model: string;
}
export class GeminiService {
  private model;
  constructor(modelName: string = 'gemini-pro') {
    this.model = genAI.getGenerativeModel({ model: modelName });
  }
  /**
   * Génère une réponse à partir d'un prompt simple
   */
  async generateResponse(prompt: string): Promise<GeminiResponse> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return {
        text,
        model: 'gemini-pro',
        confidence: 0.85, // Gemini ne fournit pas de score de confiance direct
      };
    } catch (error) {
      console.error('Erreur Gemini:', error);
      throw new Error('Erreur lors de la génération de la réponse IA');
    }
  }
  /**
   * Chat avec historique de conversation
   */
  async chatWithHistory(
    messages: GeminiMessage[],
    newMessage: string
  ): Promise<GeminiResponse> {
    try {
      // Convertir l'historique au format Gemini
      const history = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts,
      }));
      const chat = this.model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });
      const result = await chat.sendMessage(newMessage);
      const response = await result.response;
      const text = response.text();
      return {
        text,
        model: 'gemini-pro',
        confidence: 0.85,
      };
    } catch (error) {
      console.error('Erreur chat Gemini:', error);
      throw new Error('Erreur lors du chat avec l\'IA');
    }
  }
  /**
   * Analyse de sentiment et modération
   */
  async moderateContent(content: string): Promise<{
    isAppropriate: boolean;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> {
    try {
      const prompt = `
        Analysez le contenu suivant pour :
        1. Déterminer s'il est approprié (pas de contenu offensant, spam, etc.)
        2. Analyser le sentiment (positif, négatif, neutre)
        3. Donner un score de confiance (0-1)
        Contenu : "${content}"
        Répondez au format JSON :
        {
          "isAppropriate": boolean,
          "sentiment": "positive|negative|neutral",
          "confidence": number
        }
      `;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      try {
        const analysis = JSON.parse(text);
        return analysis;
      } catch {
        // Fallback si le JSON n'est pas valide
        return {
          isAppropriate: true,
          sentiment: 'neutral' as const,
          confidence: 0.5,
        };
      }
    } catch (error) {
      console.error('Erreur modération Gemini:', error);
      return {
        isAppropriate: true,
        sentiment: 'neutral' as const,
        confidence: 0.5,
      };
    }
  }
  /**
   * Génération de résumés de conversation
   */
  async summarizeConversation(messages: string[]): Promise<string> {
    try {
      const conversation = messages.join('\n');
      const prompt = `
        Résumez cette conversation de manière concise et informative :
        ${conversation}
        Résumé :
      `;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erreur résumé Gemini:', error);
      throw new Error('Erreur lors de la génération du résumé');
    }
  }
  /**
   * Suggestions de réponses pour la gouvernance
   */
  async generateGovernanceInsights(proposalText: string): Promise<{
    summary: string;
    pros: string[];
    cons: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
        Analysez cette proposition de gouvernance et fournissez :
        1. Un résumé concis
        2. Les points positifs (pros)
        3. Les points négatifs ou risques (cons)
        4. Des recommandations
        Proposition : "${proposalText}"
        Répondez au format JSON :
        {
          "summary": "string",
          "pros": ["string"],
          "cons": ["string"],
          "recommendations": ["string"]
        }
      `;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      try {
        return JSON.parse(text);
      } catch {
        return {
          summary: "Analyse non disponible",
          pros: [],
          cons: [],
          recommendations: [],
        };
      }
    } catch (error) {
      console.error('Erreur analyse gouvernance Gemini:', error);
      throw new Error('Erreur lors de l\'analyse de la proposition');
    }
  }
}
// Instance singleton
export const geminiService = new GeminiService();
// Types d'export
export type { GeminiMessage, GeminiResponse };