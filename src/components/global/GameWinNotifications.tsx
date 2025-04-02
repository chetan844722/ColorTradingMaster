import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Award, 
  Coins, 
  Trophy
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
  // Use a static placeholder for demo
  const [notifications] = useState<WinNotification[]>([]);

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