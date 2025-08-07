'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Zap, Heart } from 'lucide-react';
import { ColorPalette } from '@/components/ui/ColorPaletteFixed';
import { BackgroundShowcase } from '@/components/ui/BackgroundShowcase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-primary-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-xl bg-primary-500 flex items-center justify-center">
              <Palette className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Design System VoiceCoop
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Découvrez notre nouvelle palette de couleurs inspirée par l'innovation
            et la coopération dans l'IA vocale.
          </p>
        </motion.div>
        {/* Palette principale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ColorPalette />
        </motion.div>
        {/* Showcase des arrière-plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BackgroundShowcase />
        </motion.div>
        {/* Démonstration interactive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-surface-800 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Démonstration Interactive
              </h2>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section Hero */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Section Hero
                  </h3>
                  <div
                    className="p-6 rounded-xl text-white relative overflow-hidden shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #274755 0%, #2BA297 50%, #EAC873 100%)'
                    }}
                  >
                    <div className="relative z-10">
                      <h4 className="text-2xl font-bold mb-2">VoiceCoop</h4>
                      <p className="text-white/90 mb-4">
                        L'IA vocale coopérative du futur
                      </p>
                      <Button
                        className="bg-white text-primary-500 hover:bg-gray-100"
                        size="sm"
                      >
                        Commencer
                      </Button>
                    </div>
                    {/* Effet de particules */}
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white/30" />
                    <div className="absolute bottom-6 right-8 w-1 h-1 rounded-full bg-white/40" />
                    <div className="absolute top-1/2 right-12 w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                </div>
                {/* Cards avec accents */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cards avec Accents
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-white dark:bg-dark-700 rounded-lg border-l-4 border-secondary-500 shadow-sm">
                      <h4 className="font-medium text-gray-900 dark:text-white">Innovation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Technologie de pointe en IA vocale
                      </p>
                    </div>
                    <div
                      className="p-4 bg-white dark:bg-dark-700 rounded-lg shadow-sm border-l-4"
                      style={{ borderLeftColor: '#EAC873' }}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">Créativité</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Solutions créatives et personnalisées
                      </p>
                    </div>
                    <div
                      className="p-4 bg-white dark:bg-dark-700 rounded-lg shadow-sm border-l-4"
                      style={{ borderLeftColor: '#E87659' }}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">Communauté</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gouvernance coopérative transparente
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
        {/* Philosophie des couleurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-surface-800 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Philosophie des Couleurs
              </h2>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-500 rounded-full mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Confiance
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Le bleu profond évoque la confiance, la stabilité et le professionnalisme
                    nécessaires pour une plateforme IA sérieuse.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-500 rounded-full mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Innovation
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Le teal représente l'innovation, la croissance et la technologie
                    de pointe qui caractérise VoiceCoop.
                  </p>
                </div>
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4"
                    style={{ backgroundColor: '#EAC873' }}
                  />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Optimisme
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Le jaune doré apporte optimisme et créativité,
                    reflétant l'esprit coopératif et innovant.
                  </p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Harmonie Visuelle
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Cette palette crée une harmonie visuelle qui reflète nos valeurs :
                  <strong className="text-primary-600 dark:text-primary-400"> la confiance</strong>,
                  <strong className="text-secondary-600 dark:text-secondary-400"> l'innovation</strong>, et
                  <strong style={{ color: '#E87659' }}> la chaleur humaine</strong>
                  de notre approche coopérative.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}