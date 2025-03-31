import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Referral, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ReferralStats() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Generate a random referral code (in real app, this would come from API)
  const generateReferralCode = () => {
    const { user } = useAuth();
    if (!user) return "";
    
    const prefix = user.username.substring(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  };
  
  const referralCode = generateReferralCode();

  // Fetch referrals
  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/user/referrals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Get total earnings from referrals (this is simplified)
  const getTotalEarnings = () => {
    if (!referrals) return 0;
    
    // In a real application, we would fetch the actual earnings
    // Here we'll simulate it based on the number of referrals
    return referrals.length * 300; // Assuming average of ₹300 per referral
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Referral code copied to clipboard.",
        });
        
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually.",
          variant: "destructive",
        });
      });
  };

  // Handle share
  const handleShare = (platform: string) => {
    const shareText = `Join ColorTrade and earn big! Use my referral code ${referralCode} to get started. Download now:`;
    
    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-darkblue rounded-xl p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-6 bg-neutral w-3/4 mb-3 rounded"></div>
            <div className="h-4 bg-neutral w-full mb-4 rounded"></div>
            <div className="h-12 bg-neutral rounded-lg mb-4"></div>
            <div className="h-10 bg-neutral w-full rounded"></div>
          </div>
          <div className="bg-neutral/20 rounded-xl p-5">
            <div className="h-6 bg-neutral w-1/2 mb-3 rounded"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-20 bg-neutral rounded-lg"></div>
              <div className="h-20 bg-neutral rounded-lg"></div>
            </div>
            <div className="h-20 bg-neutral rounded-lg mb-3"></div>
            <div className="h-20 bg-neutral rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-darkblue rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">Refer Friends, Earn 5% Commission</h3>
          <p className="text-gray-400 mb-4">
            Share your referral code with friends and earn 5% commission on all their game plays. 
            No limit on how much you can earn!
          </p>
          <div className="bg-neutral rounded-lg p-4 flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-white font-montserrat">{referralCode}</div>
            <button 
              className={`text-primary hover:text-primary/80 ${copied ? 'text-success' : ''}`}
              onClick={handleCopy}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex space-x-3">
            <Button 
              className="flex-1 py-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg font-medium flex items-center justify-center"
              onClick={() => handleShare("whatsapp")}
            >
              <i className="fab fa-whatsapp mr-2"></i> WhatsApp
            </Button>
            <Button 
              className="flex-1 py-2 bg-[#3b5998] hover:bg-[#3b5998]/90 text-white rounded-lg font-medium flex items-center justify-center"
              onClick={() => handleShare("facebook")}
            >
              <i className="fab fa-facebook-f mr-2"></i> Facebook
            </Button>
            <Button 
              className="flex-1 py-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white rounded-lg font-medium flex items-center justify-center"
              onClick={() => handleShare("telegram")}
            >
              <i className="fab fa-telegram-plane mr-2"></i> Telegram
            </Button>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-5">
          <h3 className="text-white text-lg font-semibold mb-3">Your Referral Stats</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-neutral/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Total Referrals</p>
              <p className="text-white text-xl font-bold font-montserrat">
                {referrals ? referrals.length : 0}
              </p>
            </div>
            <div className="bg-neutral/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Total Earnings</p>
              <p className="text-success text-xl font-bold font-montserrat">
                ₹{getTotalEarnings().toLocaleString()}
              </p>
            </div>
          </div>
          
          {referrals && referrals.length > 0 ? (
            <>
              <h4 className="text-white text-sm font-medium mb-2">Recent Commissions</h4>
              {referrals.slice(0, 2).map((referral, index) => (
                <div key={index} className="bg-neutral/50 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-gray-400 text-xs">Commission</p>
                    <p className="text-success text-xs">+₹{Math.floor(50 + Math.random() * 100)}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                      <i className="fas fa-user text-gray-400"></i>
                    </div>
                    <div>
                      <p className="text-white text-sm">User {referral.referredId}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-neutral/50 rounded-lg p-4 text-center">
              <p className="text-gray-300 mb-2">No referrals yet</p>
              <p className="text-gray-400 text-sm">
                Share your code to start earning commissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Import useAuth here to avoid circular dependency issue
import { useAuth } from "@/hooks/use-auth";
