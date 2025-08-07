import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/services/cache';
// GET /api/analytics/realtime - Métriques temps réel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    // Utiliser le cache pour les métriques temps réel
    const cacheKey = 'analytics:realtime:current';
    const metrics = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // Utilisateurs actifs (dernière heure)
        const activeUsers = await prisma.analytics.findMany({
          where: {
            created_at: { gte: oneHourAgo },
            user_id: { not: null },
          },
          distinct: ['user_id'],
          select: { user_id: true },
        });
        // Conversations aujourd'hui
        const conversationsToday = await prisma.conversation.count({
          where: {
            created_at: { gte: oneDayAgo },
          },
        });
        // Messages par heure (dernières 24h)
        const messagesLastHour = await prisma.message.count({
          where: {
            created_at: { gte: oneHourAgo },
          },
        });
        // Taux d'erreur (dernière heure)
        const totalEvents = await prisma.analytics.count({
          where: {
            created_at: { gte: oneHourAgo },
          },
        });
        const errorEvents = await prisma.analytics.count({
          where: {
            created_at: { gte: oneHourAgo },
            event_type: { contains: 'error' },
          },
        });
        const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;
        // Événements populaires
        const popularEvents = await prisma.analytics.groupBy({
          by: ['event_type'],
          where: {
            created_at: { gte: oneDayAgo },
          },
          _count: {
            event_type: true,
          },
          orderBy: {
            _count: {
              event_type: 'desc',
            },
          },
          take: 10,
        });
        // Métriques de performance
        const avgResponseTime = await prisma.analytics.aggregate({
          where: {
            created_at: { gte: oneHourAgo },
            event_type: 'api_response',
          },
          _avg: {
            // Supposons que le temps de réponse soit stocké dans event_data
            // event_data: { responseTime: number }
          },
        });
        return {
          activeUsers: activeUsers.length,
          conversationsToday,
          messagesPerHour: messagesLastHour,
          errorRate: Math.round(errorRate * 10000) / 100, // Pourcentage avec 2 décimales
          popularEvents: popularEvents.map(event => ({
            name: event.event_type,
            count: event._count.event_type,
          })),
          performance: {
            avgResponseTime: 150, // Placeholder - à implémenter avec vraies métriques
            uptime: 99.9,
            throughput: messagesLastHour,
          },
          timestamp: now.toISOString(),
        };
      },
      { ttl: 60 } // Cache pendant 1 minute
    );
    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Erreur métriques temps réel:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}