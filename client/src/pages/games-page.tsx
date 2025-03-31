import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Game } from "@shared/schema";
import ColorPrediction from "@/components/games/ColorPrediction";
import LuckyDice from "@/components/games/LuckyDice";
import TradingMaster from "@/components/games/TradingMaster";
import ColorKing from "@/components/games/ColorKing";
import ChatWindow from "@/components/chat/ChatWindow";

export default function GamesPage() {
  const [location] = useLocation();
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("games");
  
  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("id");
    if (gameId) {
      setSelectedGameId(parseInt(gameId));
    }
  }, [location]);
  
  // Fetch games
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Get selected game
  const selectedGame = games?.find(game => game.id === selectedGameId);
  
  // Render game component based on name
  const renderGameComponent = (game: Game) => {
    switch (game.name.toLowerCase()) {
      case "color prediction":
        return <ColorPrediction game={game} />;
      case "lucky dice":
        return <LuckyDice game={game} />;
      case "trading master":
        return <TradingMaster game={game} />;
      case "color king":
        return <ColorKing game={game} />;
      default:
        return <ColorPrediction game={game} />;
    }
  };

  return (
    <Layout title="Games">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {selectedGame ? selectedGame.name : "Game Center"}
        </h1>
        <p className="text-gray-400">
          {selectedGame ? selectedGame.description : "Choose a game from below or play the featured game"}
        </p>
      </div>
      
      {selectedGame ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game Column */}
          <div className="col-span-2">
            {renderGameComponent(selectedGame)}
          </div>
          
          {/* Chat Column */}
          <div className="col-span-1">
            <ChatWindow />
          </div>
        </div>
      ) : (
        <>
          <Tabs defaultValue="games" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="games">All Games</TabsTrigger>
              <TabsTrigger value="featured">Featured Games</TabsTrigger>
            </TabsList>
            
            <TabsContent value="games" className="pt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-darkblue animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-16 w-16 bg-neutral/60 rounded-full mb-4"></div>
                        <div className="h-6 bg-neutral/60 w-2/3 rounded mb-2"></div>
                        <div className="h-4 bg-neutral/60 w-full rounded mb-3"></div>
                        <div className="h-8 bg-neutral/60 w-1/3 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {games && games.length > 0 ? (
                    games.map((game) => (
                      <Card key={game.id} className="bg-darkblue">
                        <CardContent className="p-6 flex flex-col items-center">
                          <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                            style={{
                              background: `linear-gradient(135deg, ${game.color1}60, ${game.color2}60)`
                            }}
                          >
                            <i className={`${game.icon} text-3xl text-white`}></i>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-1">{game.name}</h3>
                          <p className="text-gray-400 text-sm mb-4 text-center">{game.description}</p>
                          <Button 
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => setSelectedGameId(game.id)}
                          >
                            Play Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-gray-400">
                      <i className="fas fa-gamepad text-4xl mb-3"></i>
                      <p className="text-xl">No games available</p>
                      <p className="text-sm mt-2">Check back soon for new games!</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="featured" className="pt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="bg-darkblue animate-pulse">
                      <CardContent className="p-0">
                        <div className="h-40 bg-neutral/40"></div>
                        <div className="p-6">
                          <div className="h-6 bg-neutral/60 w-2/3 rounded mb-2"></div>
                          <div className="h-4 bg-neutral/60 w-full rounded mb-3"></div>
                          <div className="h-8 bg-neutral/60 w-1/3 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {games && games.length > 0 ? (
                    games.slice(0, 2).map((game) => (
                      <Card key={game.id} className="bg-darkblue overflow-hidden">
                        <div 
                          className="h-40 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${game.color1}80, ${game.color2}80)`
                          }}
                        >
                          <i className={`${game.icon} text-6xl text-white`}></i>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-white text-xl font-semibold mb-2">{game.name}</h3>
                          <p className="text-gray-400 mb-4">{game.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-400">
                              Min Bet: <span className="text-white">₹{game.minBet}</span>
                            </div>
                            <Button 
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => setSelectedGameId(game.id)}
                            >
                              Play Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-gray-400">
                      <i className="fas fa-fire text-4xl mb-3"></i>
                      <p className="text-xl">No featured games available</p>
                      <p className="text-sm mt-2">Check back soon for new featured games!</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <ChatWindow />
          </div>
        </>
      )}
    </Layout>
  );
}
