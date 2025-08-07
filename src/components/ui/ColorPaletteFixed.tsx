import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
export const ColorPalette: React.FC = () => {
  const colors = [
    {
      name: 'Primary (Deep Blue)',
      hex: '#274755',
      description: 'Couleur principale - Confiance et professionnalisme',
      category: 'primary'
    },
    {
      name: 'Secondary (Teal)',
      hex: '#2BA297',
      description: 'Couleur secondaire - Innovation et croissance',
      category: 'primary'
    },
    {
      name: 'Accent Gold',
      hex: '#EAC873',
      description: 'Accent doré - Élégance et valeur',
      category: 'accent'
    },
    {
      name: 'Accent Orange',
      hex: '#F5A86B',
      description: 'Accent orange - Énergie et créativité',
      category: 'accent'
    },
    {
      name: 'Surface 50',
      hex: '#F8F9FA',
      description: 'Arrière-plan très clair',
      category: 'surface'
    },
    {
      name: 'Surface 100',
      hex: '#E9ECEF',
      description: 'Arrière-plan clair',
      category: 'surface'
    }
  ];
  const categories = ['primary', 'accent', 'surface'];
  return (
    <Card className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center text-surface-800">
          Palette de Couleurs VoiceCoop
        </h2>
        <p className="text-center text-surface-600 mt-2">
          Design system révolutionnaire - Zéro blanc pur
        </p>
      </div>
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryColors = colors.filter(color => color.category === category);
          return (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-surface-800 capitalize">
                {category === 'primary' ? 'Couleurs Principales' :
                 category === 'accent' ? 'Couleurs d\'Accent' :
                 'Couleurs de Surface'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryColors.map((color, index) => (
                  <motion.div
                    key={color.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-lg border border-surface-300 hover:shadow-lg transition-all duration-300">
                      <div
                        className="h-24 w-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="p-4 bg-surface-50">
                        <h4 className="font-semibold text-surface-800 mb-1">
                          {color.name}
                        </h4>
                        <p className="text-sm text-surface-600 mb-2">
                          {color.description}
                        </p>
                        <code className="text-xs bg-surface-200 px-2 py-1 rounded text-surface-700">
                          {color.hex}
                        </code>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
export default ColorPalette;