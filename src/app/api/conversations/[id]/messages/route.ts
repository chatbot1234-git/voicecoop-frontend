import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { geminiService, GeminiMessage } from '@/lib/services/gemini';
// GET /api/conversations/[id]/messages - Récupérer les messages d'une conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    const conversationId = params.id;
    // Vérifier que l'utilisateur a accès à cette conversation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        user_id: user.id,
      },
    });
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }
    // Récupérer les messages
    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
    });
    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Erreur GET messages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
// POST /api/conversations/[id]/messages - Ajouter un message à une conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    const conversationId = params.id;
    const { content, audioUrl, audioDuration } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: 'Contenu du message requis' },
        { status: 400 }
      );
    }
    // Vérifier l'accès à la conversation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        user_id: user.id,
      },
    });
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }
    // Créer le message utilisateur
    const userMessage = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        user_id: user.id,
        content,
        role: 'user',
        audio_url: audioUrl,
        audio_duration: audioDuration,
      },
    });
    // Récupérer l'historique pour le contexte IA
    const previousMessages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      take: 10, // Limiter le contexte
    });
    // Préparer l'historique pour Gemini
    const geminiHistory: GeminiMessage[] = previousMessages
      .filter(msg => msg.id !== userMessage.id) // Exclure le message qu'on vient de créer
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    // Générer la réponse IA
    let aiMessage = null;
    try {
      const aiResponse = await geminiService.chatWithHistory(
        geminiHistory,
        content
      );
      aiMessage = await prisma.message.create({
        data: {
          conversation_id: conversationId,
          user_id: user.id,
          content: aiResponse.text,
          role: 'assistant',
          confidence: aiResponse.confidence,
          model_used: aiResponse.model,
        },
      });
      // Mettre à jour la date de modification de la conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
      });
    } catch (aiError) {
      console.error('Erreur génération IA:', aiError);
      // Créer un message d'erreur gracieux
      aiMessage = await prisma.message.create({
        data: {
          conversation_id: conversationId,
          user_id: user.id,
          content: "Désolé, je rencontre des difficultés techniques. Pouvez-vous reformuler votre question ?",
          role: 'assistant',
          confidence: 0.0,
          model_used: 'error-fallback',
        },
      });
    }
    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
      },
    });
  } catch (error) {
    console.error('Erreur POST message:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}