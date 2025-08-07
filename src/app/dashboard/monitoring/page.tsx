'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
  Server,
  Database,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface RealTimeMetrics {
  activeUsers: number;
  conversationsToday: number;
  messagesPerHour: number;
  errorRate: number;
  popularEvents: Array<{ name: string; count: number }>;
  performance: {
    avgResponseTime: number;
    uptime: number;
    throughput: number;
  };
  timestamp: string;
}
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  checks: Record<string, any>;
  timestamp: string;
  uptime: number;
}
export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  // Récupération des métriques
  const fetchMetrics = async () => {
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch('/api/analytics/realtime'),
        fetch('/api/health'),
      ]);
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur récupération métriques:', error);
    } finally {
      setLoading(false);
    }
  };
  // Auto-refresh
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-800">Monitoring</h1>
          <p className="text-surface-600 mt-2">
            Surveillance temps réel de l'infrastructure VoiceCoop
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-surface-600">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-600">Statut Général</p>
                <div className={`text-2xl font-bold ${getStatusColor(health?.status || 'unknown')}`}>
                  {health?.status || 'Inconnu'}
                </div>
              </div>
              {getStatusIcon(health?.status || 'unknown')}
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-600">Utilisateurs Actifs</p>
                <div className="text-2xl font-bold text-surface-800">
                  {metrics?.activeUsers || 0}
                </div>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-600">Messages/Heure</p>
                <div className="text-2xl font-bold text-surface-800">
                  {metrics?.messagesPerHour || 0}
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-secondary-600" />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-600">Taux d'Erreur</p>
                <div className={`text-2xl font-bold ${
                  (metrics?.errorRate || 0) > 5 ? 'text-red-600' :
                  (metrics?.errorRate || 0) > 1 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics?.errorRate?.toFixed(2) || 0}%
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-accent-orange" />
            </div>
          </Card>
        </motion.div>
      </div>
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-surface-600">Temps de Réponse Moyen</span>
                <span className="font-semibold text-surface-800">
                  {metrics?.performance.avgResponseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-600">Uptime</span>
                <span className="font-semibold text-green-600">
                  {metrics?.performance.uptime || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-600">Débit</span>
                <span className="font-semibold text-surface-800">
                  {metrics?.performance.throughput || 0} req/h
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Services
            </h3>
            <div className="space-y-3">
              {health?.checks && Object.entries(health.checks).map(([service, check]) => (
                <div key={service} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <span className="text-surface-700 capitalize">{service}</span>
                  </div>
                  <div className="text-sm text-surface-600">
                    {check.responseTime ? `${check.responseTime}ms` : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
      {/* Popular Events */}
      {metrics?.popularEvents && metrics.popularEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Événements Populaires (24h)
            </h3>
            <div className="space-y-3">
              {metrics.popularEvents.slice(0, 5).map((event, index) => (
                <div key={event.name} className="flex justify-between items-center">
                  <span className="text-surface-700">{event.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-surface-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(event.count / metrics.popularEvents[0].count) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-surface-800 w-12 text-right">
                      {event.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold text-surface-800 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informations Système
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-surface-600">Version</p>
              <p className="font-semibold text-surface-800">{health?.version || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-surface-600">Environnement</p>
              <p className="font-semibold text-surface-800">{health?.environment || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-surface-600">Uptime Serveur</p>
              <p className="font-semibold text-surface-800">
                {health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}