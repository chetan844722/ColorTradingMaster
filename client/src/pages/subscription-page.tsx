import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import { Subscription, UserSubscription } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays, addDays } from "date-fns";

export default function SubscriptionPage() {
  // Fetch subscriptions
  const { data: subscriptions, isLoading: isSubscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch user subscriptions
  const { data: userSubscriptions, isLoading: isUserSubscriptionsLoading } = useQuery<UserSubscription[]>({
    queryKey: ["/api/user/subscription"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Get active subscription if any
  const activeSubscription = userSubscriptions?.find(sub => sub.isActive);

  // Calculate subscription progress
  const calculateProgress = (subscription: UserSubscription) => {
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(today, startDate);
    
    return Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  };

  // Calculate daily rewards
  const calculateDailyRewards = (subscription: UserSubscription) => {
    if (!subscriptions) return [];
    
    const subscriptionDetails = subscriptions.find(sub => sub.id === subscription.subscriptionId);
    if (!subscriptionDetails) return [];
    
    const startDate = new Date(subscription.startDate);
    const days = [];
    
    for (let i = 0; i < subscriptionDetails.duration; i++) {
      const date = addDays(startDate, i);
      const isToday = differenceInDays(date, new Date()) === 0;
      const isPast = date < new Date();
      
      days.push({
        day: i + 1,
        date,
        reward: subscriptionDetails.dailyReward,
        status: isPast ? 'completed' : isToday ? 'current' : 'upcoming'
      });
    }
    
    return days;
  };

  return (
    <Layout title="Subscriptions">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Subscriptions</h1>
        <p className="text-gray-400">Upgrade your account with premium subscriptions</p>
      </div>

      {/* Active Subscription */}
      {isUserSubscriptionsLoading ? (
        <Card className="bg-darkblue mb-8 animate-pulse">
          <CardHeader>
            <div className="h-6 bg-neutral/60 w-1/3 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-16 bg-neutral/60 rounded mb-4"></div>
            <div className="h-8 bg-neutral/60 w-3/4 rounded mb-4"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-20 bg-neutral/60 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : activeSubscription ? (
        <Card className="bg-darkblue mb-8">
          <CardHeader>
            <CardTitle className="text-white">Your Active Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions && activeSubscription && (
              <div>
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-white text-lg font-semibold">
                        {subscriptions.find(s => s.id === activeSubscription.subscriptionId)?.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Expires: {format(new Date(activeSubscription.endDate), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <i className="fas fa-crown text-primary text-xl"></i>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-400">Subscription Progress</span>
                      <span className="text-sm text-white">
                        {Math.round(calculateProgress(activeSubscription))}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateProgress(activeSubscription)} 
                      className="h-2 bg-neutral" 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-xs">Daily Reward</p>
                      <p className="text-success text-lg font-bold">
                        ₹{subscriptions.find(s => s.id === activeSubscription.subscriptionId)?.dailyReward.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Total Reward</p>
                      <p className="text-success text-lg font-bold">
                        ₹{subscriptions.find(s => s.id === activeSubscription.subscriptionId)?.totalReward.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-white font-semibold mb-3">Daily Rewards Calendar</h3>
                <div className="grid grid-cols-7 gap-2">
                  {calculateDailyRewards(activeSubscription).map((day, index) => (
                    <div 
                      key={index}
                      className={`rounded-lg p-2 text-center border ${
                        day.status === 'completed' ? 'bg-success/10 border-success/30' : 
                        day.status === 'current' ? 'bg-primary/20 border-primary/50' : 
                        'bg-neutral/50 border-gray-700'
                      }`}
                    >
                      <div className="text-xs text-gray-400">Day {day.day}</div>
                      <div className="font-semibold text-sm text-white">
                        {format(day.date, "dd MMM")}
                      </div>
                      <div className={`text-xs ${day.status === 'completed' ? 'text-success' : 'text-gray-400'}`}>
                        ₹{day.reward.toLocaleString()}
                      </div>
                      {day.status === 'completed' && (
                        <div className="text-success text-xs mt-1">
                          <i className="fas fa-check-circle"></i> Paid
                        </div>
                      )}
                      {day.status === 'current' && (
                        <div className="text-primary text-xs mt-1">
                          <i className="fas fa-clock"></i> Today
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-darkblue mb-8">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-crown text-primary text-2xl"></i>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Active Subscription</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to a plan to start earning daily rewards
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Subscriptions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold font-poppins mb-4 text-white flex items-center">
          <i className="fas fa-crown text-secondary mr-2"></i> Available Plans
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

      {/* Subscription Benefits */}
      <Card className="bg-darkblue">
        <CardHeader>
          <CardTitle className="text-white">Subscription Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral/30 p-4 rounded-lg">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-coins text-primary text-xl"></i>
              </div>
              <h3 className="text-white font-semibold mb-2">Daily Rewards</h3>
              <p className="text-gray-400 text-sm">
                Receive automatic daily payments into your wallet without any additional effort.
              </p>
            </div>
            
            <div className="bg-neutral/30 p-4 rounded-lg">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-gamepad text-secondary text-xl"></i>
              </div>
              <h3 className="text-white font-semibold mb-2">Exclusive Games</h3>
              <p className="text-gray-400 text-sm">
                Get access to premium games with higher payouts and better winning odds.
              </p>
            </div>
            
            <div className="bg-neutral/30 p-4 rounded-lg">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-headset text-accent text-xl"></i>
              </div>
              <h3 className="text-white font-semibold mb-2">Priority Support</h3>
              <p className="text-gray-400 text-sm">
                Enjoy faster response times and dedicated support for all your queries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
