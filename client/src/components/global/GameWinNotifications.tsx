import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Award, 
  Coins, 
  Trophy, 
  CheckCircle2, 
  AlertCircle
} from "lucide-react";

interface GameWinNotificationsProps {
  compact?: boolean;
}

interface WinNotification {
  userId: number;
  username?: string;
  fullName?: string;
  amount: number;
  roundId: number;
  gameName: string;
  timestamp: Date;
}

export default function GameWinNotifications({ compact = false }: GameWinNotificationsProps) {
  const [notifications, setNotifications] = useState<WinNotification[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  interface GameResultMessage {
    type: "game_result";
    result: "win" | "loss";
    roundId: number;
    amount: number;
  }
  
  interface RoundCompletedMessage {
    type: "round_completed";
    roundId: number;
    winner: string;
  }
  
  interface UserWinMessage extends WinNotification {
    type: "user_win";
  }
  
  type WebSocketMessage = GameResultMessage | RoundCompletedMessage | UserWinMessage | { type: string; [key: string]: any };

  // Use websocket for real-time game win notifications
  const { status, sendMessage } = useWebSocket({
    onMessage: (data: WebSocketMessage) => {
      if (data.type === "game_result" && (data as GameResultMessage).result === "win") {
        // Personal win notification
        const resultData = data as GameResultMessage;
        toast({
          title: "You Won!",
          description: `You won ₹${resultData.amount} in game round #${resultData.roundId}`,
          variant: "default",
        });
      } else if (data.type === "round_completed") {
        // Global round completion notification
        handleRoundCompleted(data as RoundCompletedMessage);
      } else if (data.type === "user_win") {
        // Add to notifications list
        setNotifications(prev => [data as UserWinMessage, ...prev].slice(0, 5));
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

  interface GameBet {
    userId: number;
    betChoice: string;
    winAmount: number;
    betAmount: number;
    isWin: boolean;
  }

  interface RoundData {
    roundId: number;
    winner: string;
  }

  // Handle a completed round and broadcast message if needed
  const handleRoundCompleted = async (data: RoundData) => {
    try {
      // If user has a winning bet in this round, broadcast to chat
      // This would typically be handled by the server, but we can also do it here
      const userBets = await getUserBets(data.roundId);
      
      const winningBets = userBets.filter((bet: GameBet) => 
        bet.betChoice === data.winner && bet.userId === user?.id
      );
      
      if (winningBets.length > 0) {
        const totalWin = winningBets.reduce((sum: number, bet: GameBet) => sum + (bet.winAmount || 0), 0);
        
        // Broadcast the win to chat for others to see
        await apiRequest("POST", "/api/chat/messages", { 
          message: `I won ₹${totalWin} in round #${data.roundId}! 🎉`
        });
      }
    } catch (error) {
      console.error("Error processing round completion:", error);
    }
  };
  
  // Helper function to get user bets for a round
  const getUserBets = async (roundId: number) => {
    try {
      const res = await apiRequest("GET", `/api/user/bets?roundId=${roundId}`);
      return await res.json();
    } catch (error) {
      console.error("Error fetching user bets:", error);
      return [];
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full overflow-hidden">
      {!compact && (
        <>
          <div className="p-4 bg-primary/5 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Recent Wins</h3>
          </div>
          <Separator />
        </>
      )}
      
      <div className="p-1">
        {notifications.length > 0 ? (
          <div className={`space-y-2 p-2 ${compact ? 'max-h-[200px]' : 'max-h-[300px]'} overflow-y-auto`}>
            {notifications.map((notification, index) => (
              <Alert key={index} variant="default" className={`${compact ? 'py-1' : 'py-2'}`}>
                <Coins className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-500`} />
                <AlertTitle className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
                  {notification.username || `User #${notification.userId}`} won!
                </AlertTitle>
                <AlertDescription className={`${compact ? 'text-xs' : 'text-xs'}`}>
                  Won ₹{notification.amount} in {notification.gameName || 'a game'}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center ${compact ? 'p-4' : 'p-8'} text-center`}>
            <Award className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} text-muted-foreground mb-2`} />
            <p className="text-sm text-muted-foreground">No recent wins to display</p>
            {!compact && (
              <p className="text-xs text-muted-foreground mt-1">Play games to see wins here</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}