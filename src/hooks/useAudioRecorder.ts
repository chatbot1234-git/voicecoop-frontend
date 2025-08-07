import { useState, useRef, useCallback, useEffect } from 'react';
import { AUDIO_CONFIG } from '@/lib/config';
interface AudioRecorderOptions {
  onDataAvailable?: (audioData: Blob) => void;
  onAudioLevel?: (level: number) => void;
  sampleRate?: number;
  channels?: number;
}
export const useAudioRecorder = ({
  onDataAvailable,
  onAudioLevel,
  sampleRate = AUDIO_CONFIG.sampleRate,
  channels = AUDIO_CONFIG.channels,
}: AudioRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      const hasAudioContext = typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
      setIsSupported(hasMediaRecorder && hasGetUserMedia && hasAudioContext);
    };
    checkSupport();
  }, []);
  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const level = rms / 255; // Normalize to 0-1
    setAudioLevel(level);
    onAudioLevel?.(level);
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording, onAudioLevel]);
  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording not supported in this browser');
      return false;
    }
    try {
      setError(null);
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      // Create audio context for level monitoring
      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onDataAvailable?.(event.data);
        }
      };
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        stopRecording();
      };
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();
      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Date.now() - startTimeRef.current);
        }
      }, 100);
      // Start audio level monitoring
      monitorAudioLevel();
      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      return false;
    }
  }, [isSupported, sampleRate, channels, onDataAvailable, monitorAudioLevel]);
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    // Clean up
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    startTimeRef.current = null;
    setAudioLevel(0);
    setDuration(0);
  }, [isRecording]);
  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);
  return {
    isRecording,
    isSupported,
    error,
    audioLevel,
    duration,
    startRecording,
    stopRecording,
    toggleRecording,
  };
};
export default useAudioRecorder;