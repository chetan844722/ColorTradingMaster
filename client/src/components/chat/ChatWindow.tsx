import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { ChatMessage } from "@shared/schema";
import { format } from "date-fns";

interface ChatMessageWithUser extends ChatMessage {
  username?: string;
  fullName?: string;
}

export default function ChatWindow() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageWithUser[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat messages
  const { data: initialChatMessages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // WebSocket connection for real-time chat
  const { sendMessage, status: wsStatus } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "chat") {
        // Add new message to chat
        setChatMessages((prev) => [...prev, data.message]);
        
        // Scroll to bottom
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }
  });

  // Set initial messages when data is loaded
  useEffect(() => {
    if (initialChatMessages) {
      setChatMessages(initialChatMessages);
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [initialChatMessages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    try {
      await apiRequest("POST", "/api/chat/messages", { message: message.trim() });
      
      // Clear input
      setMessage("");
      
      // Also send via WebSocket for immediate update
      sendMessage({
        type: "chat",
        message: message.trim()
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get time ago string
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return format(messageDate, "MMM d");
  };

  // Generate random color from username (for consistent colors per user)
  const getUserColor = (username: string) => {
    const colors = [
      "primary", "secondary", "accent", "success", "danger"
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <Card className="bg-darkblue rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-medium">Live Chat</h3>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-grow p-4 overflow-y-auto" 
        style={{ maxHeight: "calc(100vh - 250px)" }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isCurrentUser = msg.userId === user?.id;
            const color = getUserColor(msg.username || msg.userId.toString());
            const initials = msg.fullName 
              ? getInitials(msg.fullName) 
              : msg.username 
                ? getInitials(msg.username) 
                : "U";
                
            return (
              <div key={msg.id} className="mb-3">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full bg-${color}/20 flex items-center justify-center mr-2 flex-shrink-0`}>
                    <span className={`text-${color} text-xs font-bold`}>{initials}</span>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="text-white text-sm font-medium">
                        {msg.fullName || msg.username || `User ${msg.userId}`}
                        {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                      </p>
                      <span className="text-gray-500 text-xs ml-2">
                        {getTimeAgo(new Date(msg.createdAt))}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center">
          <Input 
            type="text" 
            placeholder="Type a message..." 
            className="w-full bg-neutral border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={wsStatus !== "open"}
          />
          <Button 
            className="ml-2 w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg"
            onClick={handleSendMessage}
            disabled={!message.trim() || wsStatus !== "open"}
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        {wsStatus !== "open" && (
          <p className="text-xs text-yellow-500 mt-1">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Connecting to chat server...
          </p>
        )}
      </div>
    </Card>
  );
}
