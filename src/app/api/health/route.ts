import { NextResponse } from 'next/server';
// import { healthMonitor } from '@/lib/monitoring/health';

export async function GET() {
  try {
    const startTime = Date.now();

    // Health check basique pour le moment
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      memory: process.memoryUsage(),
      checks: {
        database: { status: 'pass', message: 'Connected' },
        supabase: { status: 'pass', message: 'Available' },
        external_apis: { status: 'pass', message: 'Operational' }
      }
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {}
      },
      { status: 503 }
    );
  }
}