import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_CONFIG } from '@/lib/config';
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}
interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}
export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnect = true,
  maxReconnectAttempts = WS_CONFIG.reconnectAttempts,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        console.log('WebSocket connected:', url);
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        setError(null);
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS_CONFIG.heartbeatInterval);
        onOpen?.();
      };
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // Handle pong messages
          if (message.type === 'pong') {
            return;
          }
          onMessage?.(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        onClose?.();
        // Attempt reconnection if enabled and not a clean close
        if (reconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Reconnecting in ${timeout}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, timeout);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(event);
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, maxReconnectAttempts, reconnectAttempts]);
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
  }, []);
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(messageWithTimestamp));
      return true;
    }
    return false;
  }, []);
  const sendBinary = useCallback((data: ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  return {
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    sendBinary,
  };
};
export default useWebSocket;