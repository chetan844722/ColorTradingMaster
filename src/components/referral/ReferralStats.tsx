import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Copy, Users, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { Referral, Transaction } from "@shared/schema";

export default function ReferralStats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery<Referral[]>({
    queryKey: ["/api/user/referrals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/referrals");
      return await res.json();
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/transactions");
      return await res.json();
    },
    enabled: !!user,
  });

  // Get referral code
  const referralCode = user ? `${user.username}${user.id}` : '';
  
  // Get referral URL
  const referralUrl = `${window.location.origin}/auth?ref=${referralCode}`;
  
  // Calculate referral statistics
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(ref => {
    const userTransactions = transactions.filter(t => t.userId === ref.referredId);
    return userTransactions.length > 0;
  }).length;
  
  // Calculate commission earned
  const commissionTransactions = transactions.filter(t => t.type === 'commission');
  const totalCommission = commissionTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Handle copy to clipboard
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Referral Program</CardTitle>
        <CardDescription>Earn 5% commission on your friends' earnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/10 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Your Referral Link</h3>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralUrl}
              className="flex-1 bg-background"
            />
            <Button variant={copied ? "outline" : "default"} onClick={handleCopyReferralLink}>
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <h3 className="text-2xl font-bold">{totalReferrals}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Active Referrals</p>
                  <h3 className="text-2xl font-bold">{activeReferrals}</h3>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
              </div>
              {totalReferrals > 0 && (
                <div className="mt-3">
                  <Progress value={(activeReferrals / totalReferrals) * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((activeReferrals / totalReferrals) * 100)}% active
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <h3 className="text-2xl font-bold">₹{totalCommission.toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">How It Works</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                1
              </div>
              <div>
                <h4 className="font-medium">Invite Your Friends</h4>
                <p className="text-sm text-muted-foreground">
                  Share your unique referral link with friends and colleagues
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                2
              </div>
              <div>
                <h4 className="font-medium">Friends Join & Play</h4>
                <p className="text-sm text-muted-foreground">
                  When they sign up using your link and start playing games
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                3
              </div>
              <div>
                <h4 className="font-medium">Earn Commissions</h4>
                <p className="text-sm text-muted-foreground">
                  You earn 5% commission on all their earnings
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Alert variant="default" className="bg-primary/5 border-primary/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important!</AlertTitle>
          <AlertDescription>
            Commissions are automatically added to your wallet and can be withdrawn anytime.
          </AlertDescription>
        </Alert>
      </CardContent>
      
      <Separator />
      
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-3">Your Referrals</h3>
        {isLoadingReferrals ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : referrals.length > 0 ? (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {referral.referredId.toString().substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">User #{referral.referredId}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium">
                    {commissionTransactions.filter(t => 
                      t.description?.includes(`${referral.referredId}`)
                    ).length} transactions
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {referral.commission}% commission
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">You haven't referred anyone yet</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button onClick={handleCopyReferralLink}>
          <Copy className="h-4 w-4 mr-2" />
          Share Referral Link
        </Button>
      </CardFooter>
    </Card>
  );
}