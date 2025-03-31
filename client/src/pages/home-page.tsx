import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import WalletCard from "@/components/wallet/WalletCard";
import FeaturedGames from "@/components/home/FeaturedGames";
import TransactionHistory from "@/components/home/TransactionHistory";
import { Subscription } from "@shared/schema";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import { useAuth } from "@/hooks/use-auth";
import GameWinNotifications from "@/components/global/GameWinNotifications";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch subscriptions
  const { data: subscriptions, isLoading: isSubscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <Layout title="Home">
      {/* Balance Card */}
      <div className="hidden md:block mb-8">
        <WalletCard />
      </div>

      {/* Featured Games */}
      <FeaturedGames />

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-bold font-poppins mb-4 text-white flex items-center">
          <i className="fas fa-crown text-secondary mr-2"></i> Subscription Plans
        </h2>
        
        {isSubscriptionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-darkblue rounded-xl overflow-hidden shadow-lg animate-pulse">
                <div className="p-6">
                  <div className="flex justify-between mb-4">
                    <div className="h-6 bg-neutral/60 w-1/3 rounded"></div>
                    <div className="h-10 w-10 bg-neutral/60 rounded-lg"></div>
                  </div>
                  <div className="h-8 bg-neutral/60 w-1/2 rounded mb-2"></div>
                  <div className="h-4 bg-neutral/60 w-3/4 rounded mb-2"></div>
                  <div className="h-4 bg-neutral/60 w-2/3 rounded mb-4"></div>
                  <div className="space-y-2 mb-5">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-neutral/60 rounded"></div>
                    ))}
                  </div>
                  <div className="h-10 bg-neutral/60 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((subscription, index) => (
                <SubscriptionCard 
                  key={subscription.id} 
                  subscription={subscription}
                  isPopular={index === 1} // Make the middle plan "popular"
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-400">
                <i className="fas fa-crown text-3xl mb-2"></i>
                <p>No subscription plans available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Wins & Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <TransactionHistory />
        </div>
        <div className="md:col-span-1">
          <GameWinNotifications />
        </div>
      </div>
    </Layout>
  );
}
