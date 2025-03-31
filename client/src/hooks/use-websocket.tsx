import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";

type WebSocketStatus = "connecting" | "open" | "closing" | "closed" | "error";

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<WebSocketStatus>("closed");
  const [reconnectCount, setReconnectCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { 
    onMessage, 
    reconnectInterval = 3000, 
    reconnectAttempts = 5 
  } = options;

  const connect = useCallback(() => {
    if (!user || !user.id) return;

    try {
      setStatus("connecting");
      
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        setStatus("open");
        setReconnectCount(0);
        
        // Send authentication message
        socket.send(JSON.stringify({
          type: "auth",
          userId: user.id
        }));
      };
      
      socket.onclose = () => {
        setStatus("closed");
        
        // Try to reconnect if not manually closed and not exceeding reconnect attempts
        if (reconnectCount < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };
      
      socket.onerror = () => {
        setStatus("error");
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setStatus("error");
    }
  }, [user, reconnectCount, reconnectAttempts, reconnectInterval, onMessage]);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setStatus("closing");
      socketRef.current.close();
    }
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Connect when component mounts and user is available
  useEffect(() => {
    if (user && user.id) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    status,
    reconnectCount,
    sendMessage,
    connect,
    disconnect
  };
}
