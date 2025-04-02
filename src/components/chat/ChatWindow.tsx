import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/schema";
import { Send, AlertCircle } from "lucide-react";

interface ChatMessageWithUser extends ChatMessage {
  username?: string;
  fullName?: string;
}

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch initial chat messages
  const { data: initialMessages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/chat/messages");
      return await res.json();
    },
  });

  // Set up WebSocket connection
  const { status, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "chat") {
        setMessages((prev) => [...prev, data.message]);
      }
    },
  });

  // Initialize WebSocket connection with auth
  useEffect(() => {
    if (status === "open" && user) {
      sendMessage({
        type: "auth",
        userId: user.id,
      });
    }
  }, [status, user, sendMessage]);

  // Set initial messages
  useEffect(() => {
    if (initialMessages.length) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      // Send via REST API (more reliable)
      await apiRequest("POST", "/api/chat/messages", { message: message.trim() });
      
      // Also send via WebSocket for real-time updates
      sendMessage({
        type: "chat",
        message: message.trim(),
      });
      
      setMessage("");
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format time
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  // Get user initials for avatar
  const getUserInitials = (userId: number, username?: string, fullName?: string) => {
    if (fullName) {
      const names = fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return `U${userId}`;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-xl font-semibold">Live Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-13rem)] md:h-[600px]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-3 ${
                    user && msg.userId === user.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {getUserInitials(msg.userId, msg.username, msg.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`space-y-1 ${
                    user && msg.userId === user.id
                      ? 'text-right'
                      : 'text-left'
                  }`}>
                    <div className={`px-4 py-2 rounded-lg inline-block max-w-[80%] break-words ${
                      user && msg.userId === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {msg.message}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <span className="font-medium">
                        {msg.username || `User ${msg.userId}`}
                      </span>
                      <span>•</span>
                      <span>{getTimeAgo(new Date(msg.createdAt))}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center px-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t">
        <div className="flex w-full items-end gap-2">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            size="icon" 
            className="h-[60px] w-[60px] rounded-md"
            onClick={handleSendMessage}
            disabled={!message.trim() || status !== "open"}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}