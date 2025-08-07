import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { geminiService } from '@/lib/services/gemini';
// GET /api/conversations - Récupérer les conversations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    // Récupérer les conversations avec les messages
    const conversations = await prisma.conversation.findMany({
      where: { user_id: user.id },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
          take: 5, // Limiter pour la performance
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Erreur GET conversations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
// POST /api/conversations - Créer une nouvelle conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    const { title, initialMessage } = await request.json();
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    // Créer la conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'Nouvelle conversation',
        user_id: user.id,
      },
    });
    // Si un message initial est fourni, l'ajouter
    if (initialMessage) {
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          user_id: user.id,
          content: initialMessage,
          role: 'user',
        },
      });
      // Générer une réponse IA
      try {
        const aiResponse = await geminiService.generateResponse(initialMessage);
        await prisma.message.create({
          data: {
            conversation_id: conversation.id,
            user_id: user.id,
            content: aiResponse.text,
            role: 'assistant',
            confidence: aiResponse.confidence,
            model_used: aiResponse.model,
          },
        });
      } catch (aiError) {
        console.error('Erreur génération IA:', aiError);
        // Continuer même si l'IA échoue
      }
    }
    // Récupérer la conversation complète
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
        },
      },
    });
    return NextResponse.json({
      success: true,
      data: fullConversation,
    });
  } catch (error) {
    console.error('Erreur POST conversation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}