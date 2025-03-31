import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Transaction } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, ArrowUpFromLine, Copy, RefreshCcw } from "lucide-react";

interface WalletCardProps {
  wallet: Wallet;
  transactions: Transaction[];
  upiId: string;
}

export default function WalletCard({ wallet, transactions, upiId }: WalletCardProps) {
  const [amount, setAmount] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const { toast } = useToast();
  
  const addMoneyMutation = useMutation({
    mutationFn: async (data: { amount: number; type: "deposit" }) => {
      const res = await apiRequest("POST", "/api/user/transaction", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your deposit request has been submitted for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const withdrawMoneyMutation = useMutation({
    mutationFn: async (data: { amount: number; type: "withdrawal" }) => {
      const res = await apiRequest("POST", "/api/user/transaction", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your withdrawal request has been submitted for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const pendingTransactions = transactions.filter(t => t.status === "pending");
  
  return (
    <Card className="w-full shadow-lg border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">My Wallet</CardTitle>
        <CardDescription>Manage your funds and transactions</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="bg-gradient-to-r from-primary/80 to-primary p-6 rounded-xl shadow-md mb-6">
          <p className="text-sm font-medium text-white/80">Available Balance</p>
          <h2 className="text-3xl font-bold text-white">₹{wallet.balance.toFixed(2)}</h2>
        </div>
        
        <div className="flex gap-2 mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-1/2" variant="outline">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Add Money
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Money to Wallet</DialogTitle>
                <DialogDescription>
                  Transfer money to the UPI ID below and submit your request for approval.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="p-2 bg-muted rounded-md flex items-center justify-between">
                  <span className="text-sm font-medium">{upiId}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopyUPI}
                    className="h-8 w-8"
                  >
                    {showCopied ? <RefreshCcw className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    className="col-span-3"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                      toast({
                        title: "Invalid Amount",
                        description: "Please enter a valid amount greater than 0",
                        variant: "destructive",
                      });
                      return;
                    }
                    addMoneyMutation.mutate({ 
                      amount: Number(amount),
                      type: "deposit"
                    });
                  }}
                  disabled={addMoneyMutation.isPending}
                >
                  {addMoneyMutation.isPending ? "Processing..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-1/2" variant="outline">
                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Withdraw Money</DialogTitle>
                <DialogDescription>
                  Submit your withdrawal request for admin approval.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="withdraw-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    className="col-span-3"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                      toast({
                        title: "Invalid Amount",
                        description: "Please enter a valid amount greater than 0",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (Number(amount) > wallet.balance) {
                      toast({
                        title: "Insufficient Balance",
                        description: "You don't have enough balance for this withdrawal",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    withdrawMoneyMutation.mutate({ 
                      amount: Number(amount),
                      type: "withdrawal"
                    });
                  }}
                  disabled={withdrawMoneyMutation.isPending}
                >
                  {withdrawMoneyMutation.isPending ? "Processing..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
          
        {pendingTransactions.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <h3 className="font-medium text-sm text-yellow-800 dark:text-yellow-300 mb-2">Pending Transactions</h3>
            <ul className="space-y-2">
              {pendingTransactions.map((transaction) => (
                <li key={transaction.id} className="text-sm flex justify-between">
                  <span>{transaction.type === "deposit" ? "Deposit" : "Withdrawal"}</span>
                  <span className="font-medium">₹{transaction.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="transactions" className="w-1/2">Transactions</TabsTrigger>
            <TabsTrigger value="rewards" className="w-1/2">Rewards & Commissions</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="p-1">
            <div className="max-h-60 overflow-y-auto">
              {transactions.length > 0 ? (
                <ul className="space-y-2">
                  {transactions.map((transaction) => (
                    <li key={transaction.id} className="border-b pb-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={transaction.type === "deposit" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "deposit" ? "+" : "-"}₹{transaction.amount}
                        </p>
                        <p className={`text-xs ${
                          transaction.status === "approved" 
                            ? "text-green-600" 
                            : transaction.status === "rejected" 
                            ? "text-red-600" 
                            : "text-yellow-600"
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="rewards" className="p-1">
            <div className="max-h-60 overflow-y-auto">
              {transactions.filter(t => t.type === "reward" || t.type === "commission").length > 0 ? (
                <ul className="space-y-2">
                  {transactions
                    .filter(t => t.type === "reward" || t.type === "commission")
                    .map((transaction) => (
                      <li key={transaction.id} className="border-b pb-2 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.type === "reward" ? "Daily Reward" : "Referral Commission"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600">+₹{transaction.amount}</p>
                          <p className="text-xs text-green-600">Completed</p>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No rewards or commissions yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-0 border-t-0 flex justify-end">
        <p className="text-xs text-muted-foreground">
          All transactions are subject to admin approval
        </p>
      </CardFooter>
    </Card>
  );
}