import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Game, GameRound } from "@shared/schema";

interface LuckyDiceProps {
  game: Game;
}

export default function LuckyDice({ game }: LuckyDiceProps) {
  const { toast } = useToast();
  const [timer, setTimer] = useState<number>(60);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [roundId, setRoundId] = useState<number>(0);
  const [rolling, setRolling] = useState<boolean>(false);
  const [currentDice, setCurrentDice] = useState<number>(1);
  
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
    mutationFn: async ({ number, amount }: { number: number, amount: number }) => {
      return apiRequest("POST", `/api/game-rounds/${roundId}/bet`, {
        betChoice: number.toString(),
        betAmount: amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet placed!",
        description: `Your bet on ${selectedNumber} has been placed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      setRolling(true);
      animateDiceRoll();
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
      // When timer reaches zero, simulate dice roll result
      const result = Math.floor(Math.random() * 6) + 1;
      
      setTimeout(() => {
        toast({
          title: "Round Completed",
          description: `The dice rolled: ${result}`,
        });
        
        // Check win/loss
        if (selectedNumber === result) {
          toast({
            title: "Congratulations!",
            description: `You won! Your bet has been multiplied by 6.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Better luck next time",
            description: `You lost. Try again!`,
            variant: "destructive",
          });
        }
        
        // Reset for new round
        setSelectedNumber(null);
        setRolling(false);
        startNewRound();
      }, 2000);
    }
  }, [timer, gameRound]);

  // Handle bet placement
  const handlePlaceBet = () => {
    if (selectedNumber === null) {
      toast({
        title: "No number selected",
        description: "Please select a number to place your bet.",
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
    
    placeBetMutation.mutate({ number: selectedNumber, amount });
  };

  // Animate dice roll
  const animateDiceRoll = () => {
    let rollCount = 0;
    const maxRolls = 15; // Adjust for faster/slower animation
    
    const rollInterval = setInterval(() => {
      setCurrentDice(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
      }
    }, 100);
  };

  // Quick amount selection
  const selectAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  // Dice component
  const Dice = ({ value }: { value: number }) => {
    const renderDots = () => {
      switch (value) {
        case 1:
          return <div className="absolute inset-0 flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-full"></div></div>;
        case 2:
          return (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 right-3"></div>
            </div>
          );
        case 3:
          return (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute inset-0 m-auto"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 right-3"></div>
            </div>
          );
        case 4:
          return (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 right-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 right-3"></div>
            </div>
          );
        case 5:
          return (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 right-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute inset-0 m-auto"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 right-3"></div>
            </div>
          );
        case 6:
          return (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute top-3 right-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute left-3 top-1/2 -translate-y-1/2"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute right-3 top-1/2 -translate-y-1/2"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 left-3"></div>
              <div className="w-3 h-3 bg-white rounded-full absolute bottom-3 right-3"></div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="relative w-20 h-20 bg-accent rounded-lg shadow-md">
        {renderDots()}
      </div>
    );
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
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-4">
              <div className={`transition-all duration-300 transform ${rolling ? 'scale-110 rotate-12' : ''}`}>
                <Dice value={currentDice} />
              </div>
            </div>
            
            <div className="text-gray-400 text-sm flex items-center mb-4">
              <i className="fas fa-clock mr-1"></i> Next roll: <span className="text-white ml-1">{timer}s</span>
            </div>
            
            <p className="text-center text-gray-300 mb-2">Select a number (1-6):</p>
            <div className="grid grid-cols-6 gap-2 w-full max-w-md">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <Button
                  key={num}
                  className={`h-12 ${selectedNumber === num ? 'bg-accent border-2 border-white' : 'bg-neutral hover:bg-neutral/80'}`}
                  onClick={() => setSelectedNumber(num)}
                  disabled={rolling}
                >
                  {num}
                </Button>
              ))}
            </div>
            
            <div className="mt-4 text-center text-sm text-success font-medium">
              Win Rate: 6x (Choose the correct number)
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
              onClick={() => selectAmount(100)}
              disabled={rolling}
            >
              ₹100
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(200)}
              disabled={rolling}
            >
              ₹200
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(500)}
              disabled={rolling}
            >
              ₹500
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(1000)}
              disabled={rolling}
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
              disabled={rolling}
            />
            <Button
              className="py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm whitespace-nowrap"
              onClick={handlePlaceBet}
              disabled={placeBetMutation.isPending || rolling || selectedNumber === null}
            >
              {placeBetMutation.isPending ? "Placing Bet..." : "Roll Dice"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
