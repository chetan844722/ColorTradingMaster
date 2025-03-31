import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Wallet, Game, GameRound } from "@shared/schema";

interface ColorPredictionProps {
  game: Game;
}

export default function ColorPrediction({ game }: ColorPredictionProps) {
  const { toast } = useToast();
  const [timer, setTimer] = useState<number>(60);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [roundId, setRoundId] = useState<number>(0);
  
  // WebSocket connection for real-time updates
  const { status: wsStatus, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "round_completed" && data.roundId === roundId) {
        // Update game state after round completes
        queryClient.invalidateQueries({ queryKey: [`/api/game-rounds/${roundId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
        
        // Show toast with result
        const isWinner = data.winner === selectedColor;
        toast({
          title: isWinner ? "You Won!" : "You Lost",
          description: isWinner 
            ? `Congratulations! You won with ${selectedColor}.` 
            : `Better luck next time. Winning color was ${data.winner}.`,
          variant: isWinner ? "default" : "destructive",
        });
        
        // Reset game state
        setSelectedColor(null);
        startNewRound();
      }
    }
  });

  // Fetch wallet data
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ["/api/user/wallet"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch current game round
  const { data: gameRound, isLoading: isRoundLoading } = useQuery<GameRound>({
    queryKey: [`/api/game-rounds/${roundId}`, { gameId: game.id }],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: roundId !== 0,
  });

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async ({ color, amount }: { color: string, amount: number }) => {
      return apiRequest("POST", `/api/game-rounds/${roundId}/bet`, {
        betChoice: color,
        betAmount: amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet placed!",
        description: `Your bet on ${selectedColor} has been placed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bet failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start a new round
  const startNewRound = async () => {
    try {
      const res = await fetch(`/api/game-rounds/0?gameId=${game.id}`);
      if (!res.ok) throw new Error("Failed to start new round");
      const newRound = await res.json();
      setRoundId(newRound.id);
      setTimer(60); // Reset timer
    } catch (error) {
      console.error("Error starting new round:", error);
    }
  };

  // Initialize the game
  useEffect(() => {
    if (game.id && roundId === 0) {
      startNewRound();
    }
  }, [game.id]);

  // Timer for the game round
  useEffect(() => {
    if (gameRound && !gameRound.isCompleted && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (timer === 0 && gameRound && !gameRound.isCompleted) {
      // When timer reaches zero, request a round completion (in a real game, this would be server-side)
      const colors = ["red", "green", "violet"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Simulate round completion (in production this would be handled by the server)
      // This is just for demonstration purposes
      setTimeout(() => {
        toast({
          title: "Round Completed",
          description: `The winning color is ${randomColor}.`,
        });
        
        // Reset for new round
        setSelectedColor(null);
        startNewRound();
      }, 2000);
    }
  }, [timer, gameRound]);

  // Handle bet placement
  const handlePlaceBet = () => {
    if (!selectedColor) {
      toast({
        title: "No color selected",
        description: "Please select a color to place your bet.",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (wallet && amount > wallet.balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this bet.",
        variant: "destructive",
      });
      return;
    }
    
    placeBetMutation.mutate({ color: selectedColor, amount });
  };

  // Quick amount selection
  const selectAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  return (
    <Card className="bg-darkblue rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-white font-medium">{game.name}</h3>
        <div className="flex items-center space-x-2">
          <div className="pulse-animation text-success flex items-center">
            <span className="w-2 h-2 bg-success rounded-full mr-1"></span>
            <span className="text-sm">Live</span>
          </div>
          <span className="text-xs text-gray-400">Round #{roundId}</span>
        </div>
      </div>
      
      <CardContent className="p-6">
        {/* Game Board */}
        <div className="mb-6">
          <div className="bg-neutral rounded-lg py-4 px-2 flex justify-center space-x-4 mb-4">
            <div 
              className={`w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shadow-lg transition-transform ${selectedColor === 'red' ? 'transform scale-110 ring-2 ring-white' : ''}`} 
              onClick={() => setSelectedColor('red')}
            >
              R
            </div>
            <div 
              className={`w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg transition-transform ${selectedColor === 'green' ? 'transform scale-110 ring-2 ring-white' : ''}`}
              onClick={() => setSelectedColor('green')}
            >
              G
            </div>
            <div 
              className={`w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold shadow-lg transition-transform ${selectedColor === 'violet' ? 'transform scale-110 ring-2 ring-white' : ''}`}
              onClick={() => setSelectedColor('violet')}
            >
              V
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm flex items-center">
              <i className="fas fa-clock mr-1"></i> Next round: <span className="text-white ml-1">{timer}s</span>
            </div>
            <div className="text-gray-400 text-sm">
              Win Rate: <span className="text-white">2x</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <Button 
              className={`py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium ${selectedColor === 'red' ? 'ring-2 ring-white' : ''}`}
              onClick={() => setSelectedColor('red')}
            >
              Red
            </Button>
            <Button 
              className={`py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium ${selectedColor === 'green' ? 'ring-2 ring-white' : ''}`}
              onClick={() => setSelectedColor('green')}
            >
              Green
            </Button>
            <Button 
              className={`py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium ${selectedColor === 'violet' ? 'ring-2 ring-white' : ''}`}
              onClick={() => setSelectedColor('violet')}
            >
              Violet
            </Button>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="bg-neutral/50 rounded-lg p-4">
          <h4 className="text-white text-sm font-medium mb-3">Place Your Bet</h4>
          <div className="flex space-x-3 mb-3 flex-wrap">
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(50)}
            >
              ₹50
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(100)}
            >
              ₹100
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(500)}
            >
              ₹500
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(1000)}
            >
              ₹1000
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <Input
              type="number"
              placeholder="Custom amount"
              className="w-full bg-neutral border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm mr-3"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
            <Button
              className="py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm whitespace-nowrap"
              onClick={handlePlaceBet}
              disabled={placeBetMutation.isPending || !selectedColor}
            >
              {placeBetMutation.isPending ? "Placing Bet..." : "Place Bet"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
