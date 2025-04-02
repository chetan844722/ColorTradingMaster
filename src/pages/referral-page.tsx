import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReferralStats from "@/components/referral/ReferralStats";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Referral } from "@shared/schema";
import { format } from "date-fns";

export default function ReferralPage() {
  // Fetch referrals
  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/user/referrals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Calculate total earnings (this is simplified)
  const getTotalEarnings = () => {
    if (!referrals) return 0;
    
    // In a real application, we would fetch the actual earnings
    // Here we'll simulate it based on the number of referrals
    return referrals.length * 300; // Assuming average of ₹300 per referral
  };

  return (
    <Layout title="Refer & Earn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Refer & Earn</h1>
        <p className="text-gray-400">Invite friends and earn 5% commission on all their gameplay</p>
      </div>

      {/* Referral Stats */}
      <div className="mb-8">
        <ReferralStats />
      </div>

      {/* Referral History */}
      <Card className="bg-darkblue">
        <CardHeader>
          <CardTitle className="text-white">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-neutral/40 w-full mb-2 rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral/40 w-full mb-2 rounded"></div>
              ))}
            </div>
          ) : referrals && referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Referred User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Commission Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estimated Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => {
                    // Simulate earnings (in a real app, this would come from the API)
                    const earnings = Math.floor(100 + Math.random() * 500);
                    
                    return (
                      <tr key={referral.id} className="border-b border-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                              <i className="fas fa-user text-primary"></i>
                            </div>
                            <div className="text-sm font-medium text-white">
                              User {referral.referredId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{referral.commission}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-success">₹{earnings}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {format(new Date(referral.createdAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-primary text-2xl"></i>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">No Referrals Yet</h3>
              <p className="text-gray-400 mb-4">
                Share your referral code with friends to start earning commissions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <div className="mt-8">
        <h2 className="text-xl font-bold font-poppins mb-4 text-white">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-darkblue">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary text-xl font-bold">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Share Your Code</h3>
                <p className="text-gray-400 text-sm">
                  Share your unique referral code with friends via WhatsApp, Facebook, or Telegram.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-darkblue">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-secondary text-xl font-bold">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Friends Join & Play</h3>
                <p className="text-gray-400 text-sm">
                  Your friends sign up using your referral code and start playing games.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-darkblue">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-accent text-xl font-bold">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Earn Commissions</h3>
                <p className="text-gray-400 text-sm">
                  Earn 5% commission on all games played by your referred friends forever.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
