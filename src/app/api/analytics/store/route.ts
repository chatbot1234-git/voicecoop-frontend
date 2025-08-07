import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/services/cache';
// POST /api/analytics/store - Stocke un événement analytics
export async function POST(request: NextRequest) {
  try {
    const { eventType, eventData, userId, sessionId } = await request.json();
    if (!eventType) {
      return NextResponse.json(
        { error: 'Type d\'événement requis' },
        { status: 400 }
      );
    }
    // Obtenir l'IP et User-Agent
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    // Stocker l'événement en base
    await prisma.analytics.create({
      data: {
        user_id: userId,
        event_type: eventType,
        event_data: eventData || {},
        ip_address: ip,
        user_agent: userAgent,
      },
    });
    // Mettre en cache les métriques temps réel
    const cacheKey = `analytics:realtime:${new Date().toISOString().split('T')[0]}`;
    const currentMetrics = await cacheService.get(cacheKey) || {
      events: 0,
      uniqueUsers: new Set(),
      topEvents: {},
    };
    currentMetrics.events += 1;
    if (userId) {
      currentMetrics.uniqueUsers.add(userId);
    }
    currentMetrics.topEvents[eventType] = (currentMetrics.topEvents[eventType] || 0) + 1;
    // Convertir Set en Array pour la sérialisation
    const metricsToCache = {
      ...currentMetrics,
      uniqueUsers: Array.from(currentMetrics.uniqueUsers),
    };
    await cacheService.set(cacheKey, metricsToCache, { ttl: 86400 }); // 24h
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur stockage analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
// GET /api/analytics/store - Récupère les événements analytics
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    // Construire les filtres
    const where: any = {}
    if (startDate) {
      where.created_at = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        lte: new Date(endDate),
      };
    }
    if (eventType) {
      where.event_type = eventType;
    }
    // Récupérer les événements
    const events = await prisma.analytics.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        event_type: true,
        event_data: true,
        created_at: true,
        user_id: true,
      },
    });
    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Erreur récupération analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}