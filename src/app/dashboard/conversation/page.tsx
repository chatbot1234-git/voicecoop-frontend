'use client';
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MessageSquare,
  User,
  Bot,
  Clock,
  Zap,
  Volume2,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AudioVisualizer } from '@/components/voice/AudioVisualizer';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { useConversationStore } from '@/stores/conversationStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/stores/authStore';
import { cn, formatters } from '@/lib/utils';
export default function ConversationPage() {
  const { user } = useAuth();
  const {
    messages,
    loading,
    error,
    transcriptionBuffer,
    sendMessage,
    loadHistory,
    clearMessages,
    addMessage,
    setTranscriptionBuffer,
    appendTranscription,
  } = useConversationStore();
  const [textMessage, setTextMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Audio recording
  const {
    isRecording,
    audioLevel,
    duration,
    startRecording,
    stopRecording,
    toggleRecording,
    error: audioError,
  } = useAudioRecorder({
    onDataAvailable: (audioData) => {
      // TODO: Send audio data to WebSocket
      console.log('Audio data available:', audioData.size, 'bytes');
    },
  });
  // WebSocket connection (simulation for now)
  const [isConnected, setIsConnected] = useState(true);
  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      loadHistory(user.id);
    }
  }, [user, loadHistory]);
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // Handle text message send
  const handleSendMessage = async () => {
    if (!textMessage.trim() || loading) return;
    try {
      await sendMessage(textMessage, {
        mode: 'text',
        timestamp: new Date().toISOString(),
      });
      setTextMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  // Handle voice recording
  const handleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
      // Process transcription buffer if available
      if (transcriptionBuffer.trim()) {
        sendMessage(transcriptionBuffer, {
          mode: 'voice',
          duration: duration,
          audioLevel: audioLevel,
        });
        setTranscriptionBuffer('');
      }
    } else {
      startRecording();
    }
  };
  // Simulate transcription for demo
  useEffect(() => {
    if (isRecording && duration > 2000) {
      const simulatedTranscription = "Ceci est une transcription simulée de votre message vocal...";
      setTranscriptionBuffer(simulatedTranscription);
    }
  }, [isRecording, duration, setTranscriptionBuffer]);
  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversation IA</h1>
          <p className="text-gray-600">
            Discutez avec votre assistant IA vocale personnalisé
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isVoiceMode ? 'primary' : 'outline'}
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Mode Vocal
          </Button>
          <Button
            variant="ghost"
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            Nouvelle conversation
          </Button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Messages */}
          <Card className="flex-1 flex flex-col" variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
                {messages.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({messages.length} messages)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary-600" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                          message.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          {formatters.datetime(message.timestamp)}
                          {message.confidence && (
                            <>
                              <Zap className="h-3 w-3" />
                              {Math.round(message.confidence * 100)}%
                            </>
                          )}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Input Area */}
              {!isVoiceMode ? (
                <div className="flex gap-2">
                  <Input
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!textMessage.trim() || loading}
                    loading={loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Mode vocal activé - Utilisez les contrôles vocaux
                  </p>
                  {/* Live Transcription */}
                  {transcriptionBuffer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
                    >
                      <p className="text-sm text-blue-800">
                        <strong>Transcription:</strong> {transcriptionBuffer}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Voice Controls Sidebar */}
        <div className="space-y-6">
          {/* Audio Visualizer */}
          <Card variant="elevated">
            <CardContent className="text-center">
              <AudioVisualizer
                audioLevel={audioLevel}
                isRecording={isRecording}
                variant="circle"
                size="md"
                className="mb-4"
              />
              <p className="text-sm text-gray-600">
                {isRecording ? 'Enregistrement en cours...' : 'Prêt à enregistrer'}
              </p>
            </CardContent>
          </Card>
          {/* Voice Controls */}
          <VoiceControls
            isRecording={isRecording}
            isConnected={isConnected}
            isLoading={loading}
            audioLevel={audioLevel}
            duration={duration}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onToggleRecording={handleVoiceRecording}
          />
          {/* Session Stats */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages</span>
                  <span className="text-sm font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mode</span>
                  <span className="text-sm font-medium">
                    {isVoiceMode ? 'Vocal' : 'Texte'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span className={cn(
                    'text-sm font-medium',
                    isConnected ? 'text-green-600' : 'text-red-600'
                  )}>
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Quick Actions */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter conversation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Lire à voix haute
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Error Display */}
      <AnimatePresence>
        {(error || audioError) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {error || audioError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}