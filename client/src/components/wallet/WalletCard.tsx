import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function WalletCard() {
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);

  // Fetch wallet data
  const { data: wallet, isLoading } = useQuery<Wallet>({
    queryKey: ["/api/user/wallet"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/user/transaction", { 
        amount,
        type: "deposit",
        status: "pending",
        description: "Deposit request"
      });
    },
    onSuccess: () => {
      toast({
        title: "Deposit request submitted",
        description: "Your deposit will be processed once approved by admin.",
      });
      setDepositModalOpen(false);
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/user/transaction", { 
        amount: -amount, // Negative amount for withdrawals
        type: "withdrawal",
        status: "pending",
        description: "Withdrawal request"
      });
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal will be processed once approved by admin.",
      });
      setWithdrawModalOpen(false);
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeposit = () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to deposit.",
        variant: "destructive",
      });
      return;
    }
    
    depositMutation.mutate(amountNumber);
  };

  const handleWithdrawal = () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to withdraw.",
        variant: "destructive",
      });
      return;
    }
    
    if (wallet && amountNumber > wallet.balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to withdraw this amount.",
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate(amountNumber);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary to-accent/90 rounded-xl shadow-lg relative overflow-hidden">
        <CardContent className="pt-6 pb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-white/20 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-white/20 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-white/20 rounded w-full mb-4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary to-accent/90 rounded-xl shadow-lg relative overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Balance</p>
            <h2 className="text-3xl font-bold text-white mt-1 font-montserrat">
              ₹{wallet?.balance.toLocaleString() || '0'}
            </h2>
            <div className="flex mt-4 gap-3">
              <Button 
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={() => setDepositModalOpen(true)}
              >
                <i className="fas fa-plus mr-2"></i> Add Money
              </Button>
              <Button 
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={() => setWithdrawModalOpen(true)}
              >
                <i className="fas fa-arrow-right mr-2"></i> Withdraw
              </Button>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg px-3 py-2">
              <p className="text-white/80 text-xs">Last Transaction</p>
              <p className="text-white text-sm font-medium">+ ₹1,200</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full bg-white/10"></div>
      </CardContent>

      {/* Deposit Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-darkblue rounded-xl p-6 w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white font-poppins">Deposit Money</h2>
              <button 
                className="text-gray-400 hover:text-white" 
                onClick={() => setDepositModalOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to deposit"
                className="w-full bg-neutral border border-gray-700"
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400">
                Your deposit will be available in your wallet once approved by admin.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => setDepositModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
              >
                {depositMutation.isPending ? "Processing..." : "Deposit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-darkblue rounded-xl p-6 w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white font-poppins">Withdraw Money</h2>
              <button 
                className="text-gray-400 hover:text-white" 
                onClick={() => setWithdrawModalOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="w-full bg-neutral border border-gray-700"
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Available Balance
              </label>
              <div className="bg-neutral/50 py-2 px-3 rounded-md">
                <p className="text-white">₹{wallet?.balance.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400">
                Your withdrawal will be processed once approved by admin.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => setWithdrawModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                onClick={handleWithdrawal}
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
