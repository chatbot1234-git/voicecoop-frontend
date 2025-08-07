import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Loader2
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import {cn} from '@/lib/utils';
interface VoiceControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  isLoading: boolean;
  audioLevel: number;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleRecording: () => void;
  onSettings?: () => void;
  className?: string;
  disabled?: boolean;
}
export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isRecording,
  isConnected,
  isLoading,
  audioLevel,
  duration,
  onStartRecording,
  onStopRecording,
  onToggleRecording,
  onSettings,
  className,
  disabled = false,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const getConnectionStatus = () => {
    if (isLoading) return { text: 'Connexion...', color: 'text-yellow-600' };
    if (isConnected) return { text: 'Connecté', color: 'text-green-600' };
    return { text: 'Déconnecté', color: 'text-red-600' };
  };
  const status = getConnectionStatus();
  return (
    <div className={cn('bg-white rounded-xl shadow-lg border border-gray-200 p-6', className)}>
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('h-2 w-2 rounded-full', {
            'bg-green-500 animate-pulse': isConnected && !isLoading,
            'bg-yellow-500 animate-pulse': isLoading,
            'bg-red-500': !isConnected && !isLoading,
          })} />
          <span className={cn('text-sm font-medium', status.color)}>
            {status.text}
          </span>
        </div>
        {/* Duration */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-gray-600">
                {formatDuration(duration)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Audio Level Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Niveau audio</span>
          <span className="text-sm font-mono text-gray-500">
            {Math.round(audioLevel * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={cn('h-2 rounded-full transition-colors', {
              'bg-green-500': audioLevel > 0.1 && audioLevel < 0.7,
              'bg-yellow-500': audioLevel >= 0.7 && audioLevel < 0.9,
              'bg-red-500': audioLevel >= 0.9,
              'bg-gray-400': audioLevel <= 0.1,
            })}
            style={{ width: `${audioLevel * 100}%` }}
            animate={{ width: `${audioLevel * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Record Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onToggleRecording}
            disabled={disabled || !isConnected}
            size="lg"
            variant={isRecording ? 'secondary' : 'primary'}
            className={cn(
              'h-16 w-16 rounded-full p-0 relative overflow-hidden',
              isRecording && 'bg-red-500 hover:bg-red-600 text-white'
            )}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                >
                  <Loader2 className="h-6 w-6 animate-spin" />
                </motion.div>
              ) : isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Square className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Mic className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Pulse effect when recording */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </Button>
        </motion.div>
        {/* Mute Button */}
        <IconButton
          icon={isMuted ? <VolumeX /> : <Volume2 />}
          onClick={() => setIsMuted(!isMuted)}
          variant="outline"
          disabled={disabled}
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        />
        {/* Settings Button */}
        {onSettings && (
          <IconButton
            icon={<Settings />}
            onClick={onSettings}
            variant="ghost"
            disabled={disabled}
            aria-label="Paramètres audio"
          />
        )}
      </div>
      {/* Recording Instructions */}
      <AnimatePresence>
        {!isRecording && isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600 mb-2">
              Cliquez sur le microphone pour commencer l'enregistrement
            </p>
            <p className="text-xs text-gray-500">
              Parlez clairement et naturellement
            </p>
          </motion.div>
        )}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-sm text-red-600 font-medium mb-2">
              🔴 Enregistrement en cours...
            </p>
            <p className="text-xs text-gray-500">
              Cliquez sur le bouton pour arrêter
            </p>
          </motion.div>
        )}
        {!isConnected && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-sm text-red-600 mb-2">
              Connexion requise pour l'enregistrement
            </p>
            <p className="text-xs text-gray-500">
              Vérifiez votre connexion réseau
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Quick Stats */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDuration(duration)}
              </div>
              <div className="text-xs text-gray-500">Durée</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(audioLevel * 100)}%
              </div>
              <div className="text-xs text-gray-500">Niveau</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default VoiceControls;