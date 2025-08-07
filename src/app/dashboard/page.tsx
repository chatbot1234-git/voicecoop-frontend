'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MessageSquare,
  Mic,
  Users,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/stores/authStore';
export default function DashboardPage() {
  const { user } = useAuth();
  const quickActions = [
    {
      title: 'Nouvelle Conversation',
      description: 'Démarrer une conversation IA vocale',
      icon: <MessageSquare className="h-6 w-6" />,
      href: '/dashboard/conversation',
      color: 'bg-primary-500',
    },
    {
      title: 'Voice Studio',
      description: 'Créer et gérer vos sessions vocales',
      icon: <Mic className="h-6 w-6" />,
      href: '/dashboard/voice',
      color: 'bg-accent-green',
    },
    {
      title: 'Gouvernance',
      description: 'Participer aux décisions coopératives',
      icon: <Users className="h-6 w-6" />,
      href: '/dashboard/governance',
      color: 'bg-accent-purple',
    },
    {
      title: 'Analytics',
      description: 'Voir vos métriques et statistiques',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/dashboard/analytics',
      color: 'bg-accent-orange',
    },
  ];
  const stats = [
    {
      name: 'Conversations',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: 'Temps vocal',
      value: '2.4h',
      change: '+8%',
      changeType: 'positive',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      name: 'Précision IA',
      value: '94%',
      change: '+2%',
      changeType: 'positive',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      name: 'Score Sécurité',
      value: '100%',
      change: '0%',
      changeType: 'neutral',
      icon: <Shield className="h-5 w-5" />,
    },
  ];
  const recentActivity = [
    {
      type: 'conversation',
      title: 'Conversation IA terminée',
      description: 'Session de 15 minutes avec 98% de précision',
      time: 'Il y a 2 heures',
      icon: <MessageSquare className="h-4 w-4 text-primary-600" />,
    },
    {
      type: 'voice',
      title: 'Session vocale créée',
      description: 'Nouvelle session "Projet Marketing"',
      time: 'Il y a 4 heures',
      icon: <Mic className="h-4 w-4 text-accent-green" />,
    },
    {
      type: 'governance',
      title: 'Vote participé',
      description: 'Proposition "Amélioration UI" - Vote: Pour',
      time: 'Il y a 1 jour',
      icon: <Users className="h-4 w-4 text-accent-purple" />,
    },
  ];
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          Bonjour, {user?.full_name?.split(' ')[0]} ! 👋
        </h1>
        <p className="text-primary-100 text-lg mb-6">
          Prêt à explorer les possibilités de l'IA vocale coopérative ?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/conversation">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Commencer une conversation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-primary-600"
          >
            Voir le guide
          </Button>
        </div>
      </motion.div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="elevated" padding="md">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    stat.changeType === 'positive' ? 'text-accent-green' :
                    stat.changeType === 'negative' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-accent-green' :
                    stat.changeType === 'negative' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link href={action.href}>
                <Card hover className="h-full">
                  <CardContent>
                    <div className={`h-12 w-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <div className="flex items-center text-primary-600 text-sm font-medium">
                      Commencer
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Activité Récente</h2>
          <Card variant="elevated">
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Quick Info */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations</h2>
          <div className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Statut Coopératif</CardTitle>
                <CardDescription>Votre participation à la gouvernance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Votes participés</span>
                    <span className="text-sm font-medium">12/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Propositions soumises</span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Score participation</span>
                    <span className="text-sm font-medium text-accent-green">Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Prochaines Étapes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Compléter votre profil</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Première conversation IA</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Rejoindre la communauté</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}