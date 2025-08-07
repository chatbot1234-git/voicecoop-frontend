'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Mic,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Play,
  CheckCircle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 relative overflow-hidden">
      {/* Header Next-Gen */}
      <header className="relative z-10 px-6 py-4">
        <div className="absolute inset-0 bg-surface-100/10 backdrop-blur-md border-b border-surface-300/20" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center shadow-lg">
              <Mic className="h-6 w-6 text-surface-50" />
            </div>
            <div>
              <span className="text-xl font-display font-bold text-surface-800">VoiceCoop</span>
              <p className="text-xs text-surface-600">IA Vocale Coopérative</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <ThemeToggle className="mr-4" />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                Commencer
              </Button>
            </Link>
          </motion.div>
        </nav>
      </header>
      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        {/* Next-Gen Background Effects - Révolutionnaire */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Mesh gradient futuriste */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, #2BA297 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, #EAC873 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, #F5A86B 0%, transparent 50%),
                radial-gradient(circle at 60% 30%, #E87659 0%, transparent 50%),
                linear-gradient(135deg, #274755 0%, #2BA297 100%)
              `
            }}
          />
          {/* Orbes animés avec glow */}
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #00f5ff 0%, #8b5cf6 50%, #ec4899 100%)',
              filter: 'blur(40px)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, 360],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-25 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #10b981 0%, #f59e0b 50%, #ef4444 100%)',
              filter: 'blur(35px)',
            }}
            animate={{
              scale: [1.3, 0.7, 1.3],
              opacity: [0.25, 0.45, 0.25],
              rotate: [360, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
          {/* Formes géométriques futuristes */}
          <motion.div
            className="absolute top-1/3 right-1/3 w-40 h-40 opacity-10"
            style={{
              background: 'conic-gradient(from 0deg, #00f5ff, #8b5cf6, #ec4899, #10b981, #00f5ff)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          {/* Particules néon flottantes */}
          {[...Array(12)].map((_, i) => {
            const neonColors = ['#00f5ff', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
            const color = neonColors[i % neonColors.length];
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  backgroundColor: color,
                  width: `${0.5 + (i % 4) * 0.3}rem`,
                  height: `${0.5 + (i % 4) * 0.3}rem`,
                  left: `${10 + i * 8}%`,
                  top: `${20 + (i % 5) * 12}%`,
                  boxShadow: `0 0 20px ${color}`,
                  filter: 'blur(1px)',
                }}
                animate={{
                  y: [-40, 40, -40],
                  x: [-20, 20, -20],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 8 + i * 0.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 1.2,
                }}
              />
            );
          })}
          {/* Grille holographique */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 245, 255, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 245, 255, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          {/* Lignes de connexion animées */}
          <svg className="absolute inset-0 w-full h-full opacity-10" style={{ filter: 'blur(1px)' }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {[...Array(6)].map((_, i) => (
              <motion.line
                key={i}
                x1={`${20 + i * 15}%`}
                y1={`${30 + i * 10}%`}
                x2={`${60 + i * 10}%`}
                y2={`${70 - i * 8}%`}
                stroke="url(#lineGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </svg>
        </div>
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenu principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-gray-900 dark:text-white leading-tight">
                L'IA Vocale
                <span className="text-primary-500 dark:text-secondary-400"> Coopérative</span>
                <br />
                du Futur
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                La première plateforme d'intelligence artificielle vocale
                avec gouvernance transparente et sécurité quantique.
                Révolutionnez vos interactions vocales.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="group">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/nextgen-showcase">
                  <Button variant="outline" size="lg" className="group">
                    <Play className="mr-2 h-5 w-5" />
                    Voir la démo
                  </Button>
                </Link>
              </div>
              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Disponibilité</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">&lt;200ms</div>
                  <div className="text-sm text-gray-600">Latence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-600">Sécurisé</div>
                </div>
              </div>
            </motion.div>
            {/* Visualisation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto w-80 h-80 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center"
                  >
                    <Mic className="h-16 w-16 text-primary-600" />
                  </motion.div>
                </div>
              </div>
              {/* Éléments flottants */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3"
              >
                <Users className="h-6 w-6 text-primary-600" />
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3"
              >
                <Shield className="h-6 w-6 text-accent-green" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Pourquoi VoiceCoop ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme révolutionnaire qui combine IA vocale avancée,
              gouvernance coopérative et sécurité de niveau entreprise.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic className="h-8 w-8" />,
                title: "IA Vocale Avancée",
                description: "Reconnaissance vocale ultra-rapide avec personnalisation selon votre profil et contexte conversationnel.",
                color: "text-primary-600"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Gouvernance Coopérative",
                description: "Participez aux décisions de la plateforme. Transparence totale et redistribution équitable des bénéfices.",
                color: "text-accent-green"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Sécurité Quantique",
                description: "Chiffrement end-to-end post-quantique. Conformité RGPD et EU AI Act 2024 intégrée.",
                color: "text-accent-purple"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Performance Ultime",
                description: "Latence < 200ms, disponibilité 99.9%. Architecture microservices scalable.",
                color: "text-accent-orange"
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: "Facilité d'Usage",
                description: "Interface neuro-pédagogique. Onboarding < 2 minutes. Courbe d'apprentissage minimale.",
                color: "text-primary-600"
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "Innovation Continue",
                description: "Développement communautaire. Fonctionnalités votées par les utilisateurs. Roadmap transparente.",
                color: "text-accent-green"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary-600">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Prêt à révolutionner vos interactions vocales ?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Rejoignez la première coopérative d'IA vocale au monde.
              Gratuit pour commencer, équitable pour tous.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary-600 hover:bg-gray-100"
                >
                  Commencer gratuitement
                </Button>
              </Link>
              <Link href="/dashboard/conversation">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Planifier une démo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}