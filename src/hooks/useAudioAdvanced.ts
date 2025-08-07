import { useState, useRef, useCallback, useEffect } from 'react';
import { webSocketService } from '@/lib/services/websocket';
import { ultravoxService } from '@/lib/services/ultravox';
export interface AudioConfig {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}
export interface AudioState {
  isRecording: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  duration: number;
  volume: number;
  error: string | null;
  transcription: string | null;
  confidence: number | null;
}
export interface UseAudioAdvancedOptions {
  config?: AudioConfig;
  enableRealTimeTranscription?: boolean;
  enableWebSocketStreaming?: boolean;
  conversationId?: string;
  onTranscription?: (text: string, confidence: number) => void;
  onError?: (error: string) => void;
  onAudioData?: (audioData: ArrayBuffer) => void;
}
export function useAudioAdvanced(options: UseAudioAdvancedOptions = {}) {
  const {
    config = {},
    enableRealTimeTranscription = false,
    enableWebSocketStreaming = false,
    conversationId,
    onTranscription,
    onError,
    onAudioData,
  } = options;
  // État
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    isPlaying: false,
    isProcessing: false,
    duration: 0,
    volume: 0,
    error: null,
    transcription: null,
    confidence: null,
  });
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  // Configuration audio par défaut
  const audioConfig: AudioConfig = {
    sampleRate: 44100,
    channels: 1,
    bitDepth: 16,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...config,
  };
  // Mise à jour de l'état
  const updateState = useCallback((updates: Partial<AudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  // Gestion des erreurs
  const handleError = useCallback((error: string) => {
    console.error('Erreur audio:', error);
    updateState({ error, isRecording: false, isProcessing: false });
    onError?.(error);
  }, [updateState, onError]);
  // Analyse du volume en temps réel
  const analyzeVolume = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    // Calculer le volume moyen
    const sum = dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / dataArray.length;
    const volume = Math.round((average / 255) * 100);
    updateState({ volume });
    if (state.isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeVolume);
    }
  }, [state.isRecording, updateState]);
  // Mise à jour de la durée
  const updateDuration = useCallback(() => {
    if (state.isRecording && startTimeRef.current) {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      updateState({ duration });
      setTimeout(updateDuration, 100);
    }
  }, [state.isRecording, updateState]);
  // Initialisation de l'audio context
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch (error) {
      throw new Error('Impossible d\'initialiser le contexte audio');
    }
  }, []);
  // Démarrage de l'enregistrement
  const startRecording = useCallback(async () => {
    try {
      updateState({ isProcessing: true, error: null });
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: audioConfig.sampleRate,
          channelCount: audioConfig.channels,
          echoCancellation: audioConfig.echoCancellation,
          noiseSuppression: audioConfig.noiseSuppression,
          autoGainControl: audioConfig.autoGainControl,
        },
      });
      streamRef.current = stream;
      // Initialiser l'audio context pour l'analyse
      const audioContext = await initializeAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      // Configurer MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      // Gestion des données audio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          // Streaming WebSocket si activé
          if (enableWebSocketStreaming && conversationId) {
            event.data.arrayBuffer().then(buffer => {
              try {
                webSocketService.sendAudioChunk(conversationId, buffer);
                onAudioData?.(buffer);
              } catch (error) {
                console.error('Erreur streaming WebSocket:', error);
              }
            });
          }
        }
      };
      // Fin d'enregistrement
      mediaRecorder.onstop = async () => {
        try {
          updateState({ isProcessing: true });
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          // Transcription si activée
          if (enableRealTimeTranscription) {
            try {
              const transcription = await ultravoxService.transcribeAudio(audioBlob);
              updateState({
                transcription: transcription.text,
                confidence: transcription.confidence,
              });
              onTranscription?.(transcription.text, transcription.confidence);
            } catch (transcriptionError) {
              console.error('Erreur transcription:', transcriptionError);
            }
          }
          updateState({ isProcessing: false });
        } catch (error) {
          handleError('Erreur lors du traitement de l\'audio');
        }
      };
      // Démarrer l'enregistrement
      mediaRecorder.start(100); // Chunks de 100ms pour le streaming
      startTimeRef.current = Date.now();
      updateState({
        isRecording: true,
        isProcessing: false,
        duration: 0,
        transcription: null,
        confidence: null,
      });
      // Démarrer l'analyse du volume
      analyzeVolume();
      updateDuration();
    } catch (error) {
      handleError('Impossible d\'accéder au microphone');
    }
  }, [
    audioConfig,
    enableWebSocketStreaming,
    enableRealTimeTranscription,
    conversationId,
    onTranscription,
    onAudioData,
    updateState,
    handleError,
    initializeAudioContext,
    analyzeVolume,
    updateDuration,
  ]);
  // Arrêt de l'enregistrement
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    updateState({
      isRecording: false,
      volume: 0,
    });
  }, [state.isRecording, updateState]);
  // Lecture d'un fichier audio
  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      updateState({ isPlaying: true, error: null });
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        updateState({ isPlaying: false });
      };
      audio.onerror = () => {
        handleError('Erreur lors de la lecture audio');
      };
      await audio.play();
    } catch (error) {
      handleError('Impossible de lire le fichier audio');
    }
  }, [updateState, handleError]);
  // Upload d'un fichier audio
  const uploadAudio = useCallback(async (
    audioBlob: Blob,
    conversationId: string,
    messageId: string
  ): Promise<string | null> => {
    try {
      updateState({ isProcessing: true });
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('conversationId', conversationId);
      formData.append('messageId', messageId);
      formData.append('transcribe', enableRealTimeTranscription.toString());
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }
      const result = await response.json();
      if (result.success) {
        // Mettre à jour la transcription si disponible
        if (result.data.transcription) {
          updateState({
            transcription: result.data.transcription.text,
            confidence: result.data.transcription.confidence,
          });
          onTranscription?.(
            result.data.transcription.text,
            result.data.transcription.confidence
          );
        }
        updateState({ isProcessing: false });
        return result.data.upload.url;
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      handleError('Erreur lors de l\'upload audio');
      return null;
    }
  }, [enableRealTimeTranscription, updateState, handleError, onTranscription]);
  // Nettoyage
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording]);
  return {
    // État
    ...state,
    // Actions
    startRecording,
    stopRecording,
    playAudio,
    uploadAudio,
    // Utilitaires
    isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    audioBlob: chunksRef.current.length > 0
      ? new Blob(chunksRef.current, { type: 'audio/webm' })
      : null,
  };
}
export default useAudioAdvanced;