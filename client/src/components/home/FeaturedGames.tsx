import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { Game } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function FeaturedGames() {
  // Fetch games
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold font-poppins mb-4 text-white flex items-center">
          <i className="fas fa-fire text-secondary mr-2"></i> Featured Games
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-darkblue rounded-xl overflow-hidden shadow-lg animate-pulse">
              <div className="h-32 bg-neutral/60"></div>
              <div className="p-4">
                <div className="h-5 bg-neutral/60 w-3/4 mb-2 rounded"></div>
                <div className="h-4 bg-neutral/60 w-1/2 mb-3 rounded"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-neutral/60 w-1/4 rounded"></div>
                  <div className="h-8 bg-neutral/60 w-16 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold font-poppins mb-4 text-white flex items-center">
        <i className="fas fa-fire text-secondary mr-2"></i> Featured Games
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {games && games.length > 0 ? (
          games.map((game) => (
            <div key={game.id} className="game-card bg-darkblue rounded-xl overflow-hidden shadow-lg">
              <div 
                className="h-32 flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${game.color1}60, ${game.color2}60)`
                }}
              >
                <i className={`${game.icon} text-5xl text-white`}></i>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium">{game.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{game.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Min: ₹{game.minBet}</span>
                  <Link href={`/games?id=${game.id}`}>
                    <Button size="sm" className="px-3 py-1 bg-primary hover:bg-primary/90 text-white text-sm rounded">
                      Play
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center py-8 text-gray-400">
            <i className="fas fa-dice-d20 text-3xl mb-2"></i>
            <p>No games available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
