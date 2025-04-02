import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Wallet, Game, GameRound } from "@shared/schema";

interface ColorKingProps {
  game: Game;
}

export default function ColorKing({ game }: ColorKingProps) {
  const { toast } = useToast();
  const [timer, setTimer] = useState<number>(60);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [roundId, setRoundId] = useState<number>(0);
  const [gameBoard, setGameBoard] = useState<string[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [winningColor, setWinningColor] = useState<string | null>(null);
  
  // Available colors
  const colors = [
    { name: 'red', bg: 'bg-red-500', text: 'text-red-500', hover: 'hover:bg-red-600' },
    { name: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', hover: 'hover:bg-blue-600' },
    { name: 'green', bg: 'bg-green-500', text: 'text-green-500', hover: 'hover:bg-green-600' },
    { name: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-500', hover: 'hover:bg-yellow-600' },
    { name: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', hover: 'hover:bg-purple-600' }
  ];
  
  // WebSocket connection for real-time updates
  const { status: wsStatus, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "round_completed" && data.roundId === roundId) {
        // Update game state after round completes
        queryClient.invalidateQueries({ queryKey: [`/api/game-rounds/${roundId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
        
        // Show results
        setWinningColor(data.winner);
        setShowResults(true);
        
        // Show toast with result
        const isWinner = data.winner === selectedColor;
        toast({
          title: isWinner ? "You are the Color King!" : "Better luck next time",
          description: isWinner 
            ? `Congratulations! You won with ${selectedColor}.` 
            : `The winning color was ${data.winner}.`,
          variant: isWinner ? "default" : "destructive",
        });
        
        // Reset game state after delay
        setTimeout(() => {
          setSelectedColor(null);
          setShowResults(false);
          startNewRound();
        }, 3000);
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

  // Initialize game board
  const initializeGameBoard = () => {
    const board = [];
    for (let i = 0; i < 25; i++) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      board.push(colors[randomIndex].name);
    }
    setGameBoard(board);
  };

  // Start a new round
  const startNewRound = async () => {
    try {
      const res = await fetch(`/api/game-rounds/0?gameId=${game.id}`);
      if (!res.ok) throw new Error("Failed to start new round");
      const newRound = await res.json();
      setRoundId(newRound.id);
      setTimer(60); // Reset timer
      initializeGameBoard();
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
      // When timer reaches zero, determine a random winning color
      const randomIndex = Math.floor(Math.random() * colors.length);
      const winner = colors[randomIndex].name;
      
      // Show results
      setWinningColor(winner);
      setShowResults(true);
      
      // Simulate round completion
      setTimeout(() => {
        // Check if player won
        if (selectedColor === winner) {
          toast({
            title: "You are the Color King!",
            description: "Congratulations! You've won 3x your bet.",
          });
        } else {
          toast({
            title: "Better luck next time",
            description: `The winning color was ${winner}.`,
            variant: "destructive",
          });
        }
        
        // Reset for new round
        setSelectedColor(null);
        setShowResults(false);
        startNewRound();
      }, 3000);
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

  // Get color class from name
  const getColorClass = (colorName: string) => {
    const color = colors.find(c => c.name === colorName);
    return color ? color.bg : 'bg-gray-500';
  };

  // Get color text class from name
  const getColorTextClass = (colorName: string) => {
    const color = colors.find(c => c.name === colorName);
    return color ? color.text : 'text-gray-500';
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
          <div className="grid grid-cols-5 gap-2 mb-5">
            {gameBoard.map((color, index) => (
              <div 
                key={index}
                className={`aspect-square rounded-lg ${getColorClass(color)} flex items-center justify-center ${
                  showResults ? 
                    color === winningColor ? 'animate-pulse ring-4 ring-white' : 'opacity-30' 
                    : ''
                }`}
              >
                {showResults && color === winningColor && (
                  <i className="fas fa-crown text-white text-xl"></i>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm flex items-center">
              <i className="fas fa-clock mr-1"></i> Next round: <span className="text-white ml-1">{timer}s</span>
            </div>
            <div className="text-gray-400 text-sm">
              Win Rate: <span className="text-white">3x</span>
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-neutral/40 p-3 rounded-lg mb-5">
            <p className="text-sm text-gray-300 mb-3">Select your color:</p>
            <div className="flex justify-between">
              {colors.map((color) => (
                <button
                  key={color.name}
                  className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center transition-transform ${
                    selectedColor === color.name ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  onClick={() => setSelectedColor(color.name)}
                  disabled={showResults}
                >
                  {selectedColor === color.name && (
                    <i className="fas fa-check text-white"></i>
                  )}
                </button>
              ))}
            </div>
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
              onClick={() => selectAmount(500)}
              disabled={showResults}
            >
              ₹500
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(1000)}
              disabled={showResults}
            >
              ₹1000
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(2000)}
              disabled={showResults}
            >
              ₹2000
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(5000)}
              disabled={showResults}
            >
              ₹5000
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <Input
              type="number"
              placeholder="Custom amount"
              className="w-full bg-neutral border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm mr-3"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={showResults}
            />
            <Button
              className={`py-2 px-4 text-white rounded-lg font-medium text-sm whitespace-nowrap ${
                selectedColor ? getColorClass(selectedColor) : 'bg-primary hover:bg-primary/90'
              }`}
              onClick={handlePlaceBet}
              disabled={placeBetMutation.isPending || !selectedColor || showResults}
            >
              {placeBetMutation.isPending ? "Placing Bet..." : "Place Bet"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
