import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
export const BackgroundShowcase: React.FC = () => {
  const backgrounds = [
    {
      name: 'Surface Gradient',
      description: 'Dégradé principal pour les pages',
      className: 'bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200',
      darkClassName: 'dark:from-surface-950 dark:via-surface-900 dark:to-surface-800'
    },
    {
      name: 'Primary Accent',
      description: 'Dégradé avec accent primaire',
      className: 'bg-gradient-to-br from-surface-50 via-surface-100 to-primary-50',
      darkClassName: 'dark:from-surface-950 dark:via-surface-900 dark:to-primary-900'
    },
    {
      name: 'Secondary Accent',
      description: 'Dégradé avec accent secondaire',
      className: 'bg-gradient-to-br from-surface-50 via-surface-100 to-secondary-50',
      darkClassName: 'dark:from-surface-950 dark:via-surface-900 dark:to-secondary-900'
    },
    {
      name: 'Warm Gradient',
      description: 'Dégradé chaleureux avec accents',
      style: {
        background: 'linear-gradient(135deg, #f5f7fa 0%, #EAC873 20%, #F5A86B 40%, #E87659 100%)',
        opacity: 0.1
      },
      overlay: true
    }
  ];
  return (
    <Card variant="elevated" className="dark:bg-surface-800 dark:border-surface-600 bg-surface-50/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Arrière-plans et Surfaces</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {backgrounds.map((bg, index) => (
            <motion.div
              key={bg.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl border border-surface-200 dark:border-surface-600 hover:shadow-lg transition-all duration-300">
                {/* Background Preview */}
                <div
                  className={`h-32 w-full relative ${bg.className || ''} ${bg.darkClassName || ''}`}
                  style={bg.style}
                >
                  {bg.overlay && (
                    <div className="absolute inset-0 bg-surface-50 dark:bg-surface-900" />
                  )}
                  {/* Content overlay to show readability */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Contenu
                      </h4>
                      <Button size="sm" variant="primary">
                        Action
                      </Button>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-primary-500/30" />
                  <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-secondary-500/40" />
                </div>
                {/* Information */}
                <div className="p-4 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {bg.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {bg.description}
                  </p>
                </div>
                {/* Hover effect */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
        {/* Texture Patterns */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Motifs et Textures
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subtle Grid */}
            <div className="relative h-24 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-600">
              <div className="absolute inset-0 bg-surface-100 dark:bg-surface-800" />
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(39, 71, 85, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(39, 71, 85, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
              <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400">
                Grille subtile
              </div>
            </div>
            {/* Dot Pattern */}
            <div className="relative h-24 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-600">
              <div className="absolute inset-0 bg-surface-100 dark:bg-surface-800" />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle, #2BA297 1px, transparent 1px)`,
                  backgroundSize: '15px 15px'
                }}
              />
              <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400">
                Points
              </div>
            </div>
            {/* Noise Texture */}
            <div className="relative h-24 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-600">
              <div className="absolute inset-0 bg-surface-100 dark:bg-surface-800" />
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              />
              <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400">
                Texture
              </div>
            </div>
          </div>
        </div>
        {/* Usage Examples */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Exemples d'Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Example */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Cards sur Surface</h4>
              <div className="p-4 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800 rounded-lg">
                <div className="bg-surface-50/80 dark:bg-surface-800/80 backdrop-blur-sm p-4 rounded-lg border border-surface-200 dark:border-surface-600">
                  <h5 className="font-semibold text-gray-900 dark:text-white">Titre de la Card</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Contenu avec excellent contraste sur surface personnalisée.
                  </p>
                </div>
              </div>
            </div>
            {/* Navigation Example */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Navigation</h4>
              <div className="bg-surface-50/95 dark:bg-surface-900/95 backdrop-blur-sm p-4 rounded-lg border border-surface-200 dark:border-surface-600">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default BackgroundShowcase;