import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { storageService } from '@/lib/services/storage';
import { ultravoxService } from '@/lib/services/ultravox';
import { prisma } from '@/lib/prisma';
// POST /api/upload/audio - Upload d'un fichier audio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    // Vérifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const conversationId = formData.get('conversationId') as string;
    const messageId = formData.get('messageId') as string;
    const transcribe = formData.get('transcribe') === 'true';
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Fichier audio requis' },
        { status: 400 }
      );
    }
    // Validation du fichier
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      );
    }
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté' },
        { status: 400 }
      );
    }
    // Upload vers S3
    const uploadResult = await storageService.uploadAudio(
      audioFile,
      conversationId,
      messageId,
      user.id
    );
    let transcription = null;
    // Transcription optionnelle avec Ultravox
    if (transcribe) {
      try {
        const transcriptionResult = await ultravoxService.transcribeAudio(audioFile);
        transcription = {
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          duration: transcriptionResult.duration,
          language: transcriptionResult.language,
        };
      } catch (transcriptionError) {
        console.error('Erreur transcription:', transcriptionError);
        // Continuer sans transcription en cas d'erreur
      }
    }
    // Mettre à jour le message avec l'URL audio
    if (messageId) {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            audio_url: uploadResult.url,
            audio_duration: transcription?.duration,
          },
        });
      } catch (dbError) {
        console.error('Erreur mise à jour message:', dbError);
        // L'upload a réussi, mais la mise à jour DB a échoué
      }
    }
    return NextResponse.json({
      success: true,
      data: {
        upload: uploadResult,
        transcription,
      },
    });
  } catch (error) {
    console.error('Erreur upload audio:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  }
}
// GET /api/upload/audio/presigned - Génère une URL signée pour upload direct
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');
    const contentType = searchParams.get('contentType') || 'audio/webm';
    if (!conversationId || !messageId) {
      return NextResponse.json(
        { error: 'conversationId et messageId requis' },
        { status: 400 }
      );
    }
    // Vérifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    // Vérifier l'accès à la conversation
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
    // Générer la clé S3
    const timestamp = Date.now();
    const extension = contentType.split('/')[1] || 'webm';
    const key = `audio/${user.id}/${conversationId}/${messageId}_${timestamp}.${extension}`;
    // Générer l'URL signée
    const presignedData = await storageService.getPresignedUploadUrl(key, {
      contentType,
      expiresIn: 300, // 5 minutes
      metadata: {
        userId: user.id,
        conversationId,
        messageId,
      },
    });
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: presignedData.url,
        key,
        fields: presignedData.fields,
      },
    });
  } catch (error) {
    console.error('Erreur génération URL signée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}