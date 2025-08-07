'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Sparkles,
  Palette,
  Eye,
  MousePointer,
  Layers,
  Cpu,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
export default function NextGenShowcasePage() {
  const [activeDemo, setActiveDemo] = useState('buttons');
  const demos = {
    buttons: {
      title: 'Boutons Next-Gen',
      description: 'Boutons avec gradients, effets glass et animations avancées',
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="neon">Néon</Button>
          <Button variant="glass">Glass</Button>
          <Button variant="gradient">Gradient</Button>
        </div>
      )
    },
    cards: {
      title: 'Cards Futuristes',
      description: 'Cards avec effets backdrop-blur et bordures lumineuses',
      component: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" className="p-4">
            <h3 className="font-semibold text-surface-800 mb-2">Default</h3>
            <p className="text-surface-600 text-sm">Card avec effet glass subtil</p>
          </Card>
          <Card variant="neon" className="p-4">
            <h3 className="font-semibold text-surface-800 mb-2">Néon</h3>
            <p className="text-surface-600 text-sm">Card avec bordure néon</p>
          </Card>
          <Card variant="gradient" className="p-4">
            <h3 className="font-semibold text-surface-800 mb-2">Gradient</h3>
            <p className="text-surface-600 text-sm">Card avec fond gradient</p>
          </Card>
        </div>
      )
    },
    effects: {
      title: 'Effets Visuels',
      description: 'Particules, orbes animés et effets holographiques',
      component: (
        <div className="relative h-64 rounded-xl overflow-hidden bg-surface-100/20 backdrop-blur-sm border border-surface-300/30">
          {/* Orbes animés */}
          <motion.div
            className="absolute top-4 left-4 w-16 h-16 rounded-full opacity-60 blur-sm"
            style={{ background: 'radial-gradient(circle, #00f5ff 0%, #8b5cf6 100%)' }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full opacity-70 blur-sm"
            style={{ background: 'radial-gradient(circle, #ec4899 0%, #10b981 100%)' }}
            animate={{
              scale: [1.2, 0.8, 1.2],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          {/* Particules flottantes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#00f5ff', '#8b5cf6', '#ec4899', '#10b981'][i % 4],
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-surface-700 mx-auto mb-2" />
              <p className="text-surface-700 font-medium">Effets Temps Réel</p>
            </div>
          </div>
        </div>
      )
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00f5ff 0%, #8b5cf6 100%)' }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      <div className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center shadow-xl">
                <Rocket className="h-8 w-8 text-surface-50" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-surface-800 mb-4 bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
              UI/UX Next-Gen Showcase
            </h1>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              Découvrez l'interface révolutionnaire de VoiceCoop avec des effets visuels
              de pointe et une expérience utilisateur futuriste.
            </p>
          </motion.div>
          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="flex gap-2 p-2 bg-surface-200/40 backdrop-blur-sm rounded-xl border border-surface-300/40">
              {Object.entries(demos).map(([key, demo]) => (
                <button
                  key={key}
                  onClick={() => setActiveDemo(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeDemo === key
                      ? 'bg-gradient-to-r from-primary-200 to-secondary-200 text-surface-50 shadow-lg'
                      : 'text-surface-700 hover:bg-surface-300/50'
                  }`}
                >
                  {demo.title}
                </button>
              ))}
            </div>
          </motion.div>
          {/* Demo Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card variant="glass" className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-surface-800 mb-2">
                    {demos[activeDemo as keyof typeof demos].title}
                  </h2>
                  <p className="text-surface-600">
                    {demos[activeDemo as keyof typeof demos].description}
                  </p>
                </div>
                <div className="flex justify-center">
                  {demos[activeDemo as keyof typeof demos].component}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: <Palette className="h-6 w-6" />,
                title: 'Palette Révolutionnaire',
                description: 'Couleurs sophistiquées sans blanc pur'
              },
              {
                icon: <Layers className="h-6 w-6" />,
                title: 'Effets Glass',
                description: 'Backdrop-blur et transparences avancées'
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Animations Fluides',
                description: 'Micro-interactions et transitions 60fps'
              },
              {
                icon: <Cpu className="h-6 w-6" />,
                title: 'Performance Optimale',
                description: 'Rendu GPU et optimisations avancées'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card variant="elevated" className="p-6 text-center h-full">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center text-surface-50 mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-surface-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-surface-600 text-sm">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Card variant="gradient" className="p-8">
              <h2 className="text-2xl font-bold text-surface-800 mb-4">
                Prêt pour l'Avenir ?
              </h2>
              <p className="text-surface-600 mb-6 max-w-2xl mx-auto">
                Explorez toutes les fonctionnalités de VoiceCoop et découvrez
                comment notre interface next-gen révolutionne l'IA vocale coopérative.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg">
                  <Eye className="h-5 w-5 mr-2" />
                  Explorer le Dashboard
                </Button>
                <Button variant="outline" size="lg">
                  <MousePointer className="h-5 w-5 mr-2" />
                  Tester l'Interface
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}