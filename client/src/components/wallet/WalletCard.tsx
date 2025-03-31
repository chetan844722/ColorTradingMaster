import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, isAfter, isSameDay } from "date-fns";
import { Wallet, Transaction } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Copy, 
  RefreshCcw, 
  Loader2, 
  Banknote, 
  CreditCard, 
  IndianRupee, 
  BadgeCheck,
  AlertCircle,
  Clock,
  Gift
} from "lucide-react";

interface WalletCardProps {
  wallet?: Wallet;
  transactions?: Transaction[];
  upiId?: string;
}

export default function WalletCard(props: WalletCardProps) {
  const [amount, setAmount] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "other">("upi");
  const [transactionId, setTransactionId] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>({from: null, to: null});
  const { toast } = useToast();

  // Fetch wallet and transactions if not provided as props
  const { data: fetchedWallet, isLoading: isLoadingWallet } = useQuery<Wallet>({
    queryKey: ["/api/user/wallet"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/wallet");
      return await res.json();
    },
    enabled: !props.wallet,
  });

  const { data: fetchedTransactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/transactions");
      return await res.json();
    },
    enabled: !props.transactions,
  });
  
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
  
  // Use either passed props or fetched data
  const wallet = props.wallet || fetchedWallet;
  const transactions = props.transactions || fetchedTransactions || [];
  const upiId = props.upiId || "8447228346@ptsbi"; // Default UPI ID
  
  // Show loading state if data is being fetched
  const isLoading = (!props.wallet && isLoadingWallet) || (!props.transactions && isLoadingTransactions);
  
  if (isLoading) {
    return (
      <Card className="w-full shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">My Wallet</CardTitle>
          <CardDescription>Manage your funds and transactions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Return error state if wallet is not available after loading
  if (!wallet) {
    return (
      <Card className="w-full shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">My Wallet</CardTitle>
          <CardDescription>Manage your funds and transactions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Unable to load wallet data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="bg-gradient-to-r from-primary/80 to-primary p-6 rounded-xl shadow-md mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10"></div>
          <div className="absolute right-12 bottom-4 w-8 h-8 rounded-full bg-white/10"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">Available Balance</p>
            <h2 className="text-3xl font-bold text-white">₹{wallet.balance.toFixed(2)}</h2>
            <div className="flex items-center mt-3">
              <div className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5 flex items-center">
                <CreditCard className="h-3 w-3 mr-1" />
                <span>Wallet</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-1/2 font-medium">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Add Money
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Money to Wallet</DialogTitle>
                <DialogDescription>
                  Transfer money using UPI and submit your request for admin approval.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <div className="p-4 bg-muted rounded-md flex flex-col items-center justify-center gap-3 border">
                    <div className="p-3 bg-white rounded-md w-full max-w-[150px] mx-auto aspect-square flex items-center justify-center">
                      {/* This would be a QR code in a real app */}
                      <div className="relative w-full h-full bg-white flex items-center justify-center">
                        <IndianRupee className="h-16 w-16 text-primary/30" />
                        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-0.5">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`${Math.random() > 0.7 ? 'bg-black' : 'bg-transparent'} rounded-sm`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-1">Pay using UPI</p>
                      <div className="flex items-center justify-center gap-2 bg-white p-1.5 rounded-md border">
                        <span className="text-sm font-medium">{upiId}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleCopyUPI}
                          className="h-6 w-6 ml-1"
                        >
                          {showCopied ? <BadgeCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4 mt-2">
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
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[500, 1000, 2000].map((preset) => (
                      <Button 
                        key={preset} 
                        type="button" 
                        variant="outline" 
                        onClick={() => setAmount(preset.toString())}
                        className="text-sm h-9"
                      >
                        ₹{preset.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[5000, 10000, 20000].map((preset) => (
                      <Button 
                        key={preset} 
                        type="button" 
                        variant="outline" 
                        onClick={() => setAmount(preset.toString())}
                        className="text-sm h-9"
                      >
                        ₹{preset.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4 mt-3">
                    <Label htmlFor="transactionId" className="text-right text-xs">
                      Transaction ID
                    </Label>
                    <Input
                      id="transactionId"
                      placeholder="Optional reference"
                      className="col-span-3"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
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
                    setTransactionId("");
                  }}
                  disabled={addMoneyMutation.isPending}
                  className="w-full"
                >
                  {addMoneyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Banknote className="mr-2 h-4 w-4" />
                      Submit Deposit Request
                    </>
                  )}
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
                <div className="flex flex-col gap-2">
                  <div className="p-4 bg-muted/50 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">Available Balance</p>
                        <p className="text-xl font-bold text-primary">₹{wallet.balance.toFixed(2)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IndianRupee className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-1">
                      {wallet.balance > 0 ? 
                        "You can withdraw up to your available balance" : 
                        "You don't have any balance to withdraw"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4 mt-2">
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
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[100, 500, 1000].map((preset) => (
                      <Button 
                        key={preset} 
                        type="button" 
                        variant="outline" 
                        onClick={() => setAmount(preset.toString())}
                        disabled={preset > wallet.balance}
                        className="text-sm h-9"
                      >
                        ₹{preset.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(wallet.balance.toString())}
                      disabled={wallet.balance <= 0}
                      className="w-full h-9 text-sm"
                    >
                      Withdraw All (₹{wallet.balance.toFixed(2)})
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/50 rounded-md text-xs text-yellow-800 dark:text-yellow-200">
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <p>
                        Withdrawal requests are processed within 24-48 hours after admin approval. 
                        The amount will be transferred to your registered UPI ID.
                      </p>
                    </div>
                  </div>
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
                  disabled={withdrawMoneyMutation.isPending || wallet.balance <= 0}
                  className="w-full"
                >
                  {withdrawMoneyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="mr-2 h-4 w-4" />
                      Submit Withdrawal Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
          
        {pendingTransactions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center">
                <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                Pending Transactions
              </h3>
              <div className="text-xs bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full font-medium">
                {pendingTransactions.length} {pendingTransactions.length === 1 ? 'Request' : 'Requests'}
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              {pendingTransactions.map((transaction, index) => (
                <div key={transaction.id} className={`p-3 flex justify-between items-center ${index !== pendingTransactions.length - 1 ? 'border-b' : ''} ${transaction.type === 'deposit' ? 'bg-green-50/50' : 'bg-blue-50/50'}`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${transaction.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {transaction.type === 'deposit' ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.type === "deposit" ? "Deposit" : "Withdrawal"}</p>
                      <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-blue-600'}`}>
                      {transaction.type === 'deposit' ? '+' : '-'}₹{transaction.amount}
                    </p>
                    <p className="text-xs">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="transactions" className="w-1/2">Transactions</TabsTrigger>
            <TabsTrigger value="rewards" className="w-1/2">Rewards & Commissions</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="p-1">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex space-x-1">
                <Button 
                  variant={transactionFilter === "all" ? "default" : "outline"} 
                  onClick={() => setTransactionFilter("all")}
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  All
                </Button>
                <Button 
                  variant={transactionFilter === "deposit" ? "default" : "outline"} 
                  onClick={() => setTransactionFilter("deposit")}
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  Deposits
                </Button>
                <Button 
                  variant={transactionFilter === "withdrawal" ? "default" : "outline"} 
                  onClick={() => setTransactionFilter("withdrawal")}
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  Withdrawals
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`text-xs h-7 px-2 ${(dateRange.from || dateRange.to) ? "bg-primary/10" : ""}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from || new Date()}
                      selected={dateRange.from ? {
                        from: dateRange.from,
                        to: dateRange.to || undefined,
                      } : undefined}
                      onSelect={(range) => {
                        setDateRange({ 
                          from: range?.from || null, 
                          to: range?.to || null 
                        });
                      }}
                      numberOfMonths={1}
                    />
                    <div className="flex items-center justify-between px-3 pb-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDateRange({ from: null, to: null })}
                      >
                        Reset
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Close popover
                          const popoverElement = document.querySelector("[data-radix-popper-content-wrapper]");
                          if (popoverElement) {
                            // Find the close button and click it
                            const closeButton = popoverElement.querySelector("[data-state]");
                            if (closeButton instanceof HTMLElement) closeButton.click();
                          }
                        }}
                      >
                        Apply Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Select
                value={transactions.length > 0 ? "newest" : ""}
                onValueChange={(value) => {
                  // We would implement sorting logic here in a real app
                }}
              >
                <SelectTrigger className="h-7 text-xs w-[110px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest">Highest amount</SelectItem>
                  <SelectItem value="lowest">Lowest amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {transactions.length > 0 ? (
                <div className="space-y-1 px-1">
                  {transactions
                    .filter(t => {
                      // Apply type filter
                      const typeMatch = transactionFilter === "all" ? true : t.type === transactionFilter;
                      
                      // Apply date range filter
                      let dateMatch = true;
                      if (dateRange.from || dateRange.to) {
                        const transactionDate = new Date(t.createdAt);
                        if (dateRange.from && !dateRange.to) {
                          // Single date selected
                          dateMatch = isSameDay(transactionDate, dateRange.from);
                        } else if (dateRange.from && dateRange.to) {
                          // Date range selected
                          dateMatch = 
                            (isAfter(transactionDate, dateRange.from) || isSameDay(transactionDate, dateRange.from)) && 
                            (isBefore(transactionDate, dateRange.to) || isSameDay(transactionDate, dateRange.to));
                        }
                      }
                      
                      return typeMatch && dateMatch;
                    })
                    .map((transaction) => {
                    // Define icon and colors based on transaction type and status
                    let icon = <ArrowDownToLine className="h-4 w-4" />;
                    let bgColor = "bg-green-100";
                    let textColor = "text-green-600";
                    
                    if (transaction.type === "withdrawal") {
                      icon = <ArrowUpFromLine className="h-4 w-4" />;
                      bgColor = "bg-blue-100";
                      textColor = "text-blue-600";
                    } else if (transaction.type === "reward") {
                      icon = <BadgeCheck className="h-4 w-4" />;
                      bgColor = "bg-purple-100";
                      textColor = "text-purple-600";
                    } else if (transaction.type === "commission") {
                      icon = <Banknote className="h-4 w-4" />;
                      bgColor = "bg-indigo-100";
                      textColor = "text-indigo-600";
                    }
                    
                    const statusIcon = transaction.status === "approved" 
                      ? <BadgeCheck className="h-3.5 w-3.5 text-green-500" />
                      : transaction.status === "rejected"
                        ? <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        : <Clock className="h-3.5 w-3.5 text-yellow-500" />;
                        
                    const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });
                    
                    const typeLabel = {
                      deposit: "Deposit",
                      withdrawal: "Withdrawal",
                      reward: "Daily Reward",
                      commission: "Referral Commission"
                    }[transaction.type] || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
                    
                    return (
                      <div key={transaction.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-muted/30 transition-colors">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${bgColor} ${textColor}`}>
                            {icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {typeLabel}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              {formattedDate} • 
                              <span className="flex items-center ml-1">
                                {statusIcon}
                                <span className="ml-1">{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"
                          }`}>
                            {transaction.type === "withdrawal" ? "-" : "+"}₹{transaction.amount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 px-4">
                  <IndianRupee className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground/70">Add money to your wallet to get started</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="rewards" className="p-1">
            <div className="max-h-72 overflow-y-auto">
              {transactions.filter(t => t.type === "reward" || t.type === "commission").length > 0 ? (
                <div className="space-y-1 px-1">
                  {transactions
                    .filter(t => t.type === "reward" || t.type === "commission")
                    .map((transaction) => {
                      // Define icon and colors based on transaction type
                      let icon = <BadgeCheck className="h-4 w-4" />;
                      let bgColor = "bg-purple-100";
                      let textColor = "text-purple-600";
                      let label = "Daily Reward";
                      
                      if (transaction.type === "commission") {
                        icon = <Banknote className="h-4 w-4" />;
                        bgColor = "bg-indigo-100";
                        textColor = "text-indigo-600";
                        label = "Referral Commission";
                      }

                      const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      
                      return (
                        <div key={transaction.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-muted/30 transition-colors">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${bgColor} ${textColor}`}>
                              {icon}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-xs text-muted-foreground flex items-center">
                                {formattedDate} • 
                                <span className="flex items-center ml-1">
                                  <BadgeCheck className="h-3.5 w-3.5 text-green-500 ml-1 mr-0.5" />
                                  <span>Credited</span>
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+₹{transaction.amount}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-6 px-4">
                  <BadgeCheck className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">No rewards or commissions yet</p>
                  <p className="text-xs text-muted-foreground/70">Subscribe to a plan to earn daily rewards</p>
                </div>
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