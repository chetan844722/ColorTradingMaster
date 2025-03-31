import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Game, GameRound } from "@shared/schema";

interface TradingMasterProps {
  game: Game;
}

export default function TradingMaster({ game }: TradingMasterProps) {
  const { toast } = useToast();
  const [timer, setTimer] = useState<number>(60);
  const [betAmount, setBetAmount] = useState<string>("");
  const [roundId, setRoundId] = useState<number>(0);
  const [chartData, setChartData] = useState<number[]>([50, 53, 57, 55, 58, 62, 60, 65, 58, 62]);
  const [position, setPosition] = useState<'up' | 'down' | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  
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
    mutationFn: async ({ direction, amount }: { direction: string, amount: number }) => {
      return apiRequest("POST", `/api/game-rounds/${roundId}/bet`, {
        betChoice: direction,
        betAmount: amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Position opened!",
        description: `Your ${position} position has been opened.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade failed",
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
      setTimer(60);
      // Generate new chart data
      generateChartData();
    } catch (error) {
      console.error("Error starting new round:", error);
    }
  };

  // Generate random chart data
  const generateChartData = () => {
    const newData = [];
    let lastValue = 50 + Math.random() * 10;
    
    for (let i = 0; i < 10; i++) {
      lastValue += (Math.random() * 10) - 5;
      lastValue = Math.max(10, Math.min(100, lastValue));
      newData.push(Math.round(lastValue));
    }
    
    setChartData(newData);
  };

  // Draw chart
  const drawChart = () => {
    const canvas = chartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;
    
    // Find min and max values
    const min = Math.min(...chartData) * 0.9;
    const max = Math.max(...chartData) * 1.1;
    
    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * (i / 4);
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 9; i++) {
      const x = padding + (width - 2 * padding) * (i / 9);
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
    }
    
    ctx.stroke();
    
    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = '#00C8FF';
    ctx.lineWidth = 3;
    
    // Draw points
    for (let i = 0; i < chartData.length; i++) {
      const x = padding + (width - 2 * padding) * (i / (chartData.length - 1));
      const y = height - padding - (height - 2 * padding) * ((chartData[i] - min) / (max - min));
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw points
    for (let i = 0; i < chartData.length; i++) {
      const x = padding + (width - 2 * padding) * (i / (chartData.length - 1));
      const y = height - padding - (height - 2 * padding) * ((chartData[i] - min) / (max - min));
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00C8FF';
      ctx.fill();
    }
  };

  // Initialize the game
  useEffect(() => {
    if (game.id && roundId === 0) {
      startNewRound();
    }
  }, [game.id]);

  // Draw chart when data changes
  useEffect(() => {
    drawChart();
  }, [chartData]);

  // Timer for the game round
  useEffect(() => {
    if (gameRound && !gameRound.isCompleted && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
        
        // Update chart every 6 seconds
        if (timer % 6 === 0) {
          const newData = [...chartData];
          newData.shift();
          let lastValue = newData[newData.length - 1];
          lastValue += (Math.random() * 10) - 5;
          lastValue = Math.max(10, Math.min(100, lastValue));
          newData.push(Math.round(lastValue));
          setChartData(newData);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (timer === 0 && gameRound && !gameRound.isCompleted) {
      // When timer reaches zero, determine result
      const finalValue = chartData[chartData.length - 1];
      const initialValue = chartData[0];
      const result = finalValue > initialValue ? 'up' : 'down';
      
      // Determine if player won
      const playerWon = position === result;
      
      // Show result
      setTimeout(() => {
        toast({
          title: "Round Completed",
          description: `The market went ${result.toUpperCase()}.`,
        });
        
        if (position) {
          toast({
            title: playerWon ? "Trade Won!" : "Trade Lost",
            description: playerWon ? "Your prediction was correct!" : "Better luck next time.",
            variant: playerWon ? "default" : "destructive",
          });
        }
        
        // Reset for new round
        setPosition(null);
        startNewRound();
      }, 2000);
    }
  }, [timer, gameRound]);

  // Handle bet placement
  const handlePlaceBet = (direction: 'up' | 'down') => {
    if (position) {
      toast({
        title: "Position already opened",
        description: "You already have an active position for this round.",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid trade amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (wallet && amount > wallet.balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this trade.",
        variant: "destructive",
      });
      return;
    }
    
    setPosition(direction);
    placeBetMutation.mutate({ direction, amount });
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
        {/* Chart Area */}
        <div className="mb-6 bg-neutral/40 p-4 rounded-lg">
          <div className="h-64 w-full">
            <canvas 
              ref={chartRef} 
              className="w-full h-full"
              width={500}
              height={300}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-gray-400 text-sm flex items-center">
              <i className="fas fa-clock mr-1"></i> Round ends: <span className="text-white ml-1">{timer}s</span>
            </div>
            {position && (
              <div className={`text-sm font-medium ${position === 'up' ? 'text-success' : 'text-danger'}`}>
                <i className={`fas fa-arrow-${position} mr-1`}></i> Position: {position.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Betting Controls */}
        <div className="bg-neutral/50 rounded-lg p-4">
          <h4 className="text-white text-sm font-medium mb-3">Open Position</h4>
          <div className="flex space-x-3 mb-3 flex-wrap">
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(200)}
              disabled={!!position}
            >
              ₹200
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(500)}
              disabled={!!position}
            >
              ₹500
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(1000)}
              disabled={!!position}
            >
              ₹1000
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="py-1 px-3 bg-neutral hover:bg-gray-800 text-white rounded border border-gray-700 text-sm"
              onClick={() => selectAmount(2000)}
              disabled={!!position}
            >
              ₹2000
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <Input
              type="number"
              placeholder="Trade amount"
              className="w-full bg-neutral border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={!!position}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="py-3 bg-success hover:bg-success/90 text-white rounded-lg font-medium"
              onClick={() => handlePlaceBet('up')}
              disabled={placeBetMutation.isPending || !!position}
            >
              <i className="fas fa-arrow-up mr-2"></i> BUY / LONG
            </Button>
            <Button
              className="py-3 bg-danger hover:bg-danger/90 text-white rounded-lg font-medium"
              onClick={() => handlePlaceBet('down')}
              disabled={placeBetMutation.isPending || !!position}
            >
              <i className="fas fa-arrow-down mr-2"></i> SELL / SHORT
            </Button>
          </div>
          
          <div className="mt-3 text-center text-sm text-gray-400">
            Predicting correctly gives you 1.8x your investment
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
