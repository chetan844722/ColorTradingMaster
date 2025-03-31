import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import WalletCard from "@/components/wallet/WalletCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WalletPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transactions");
  
  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Transaction type filter
  const filterTransactions = (type: string) => {
    if (!transactions) return [];
    if (type === "all") return transactions;
    return transactions.filter(tx => tx.type === type);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy HH:mm");
  };

  // Get transaction details based on type
  const getTransactionDetails = (type: string) => {
    switch (type) {
      case "deposit":
        return { icon: "fa-wallet", bgColor: "bg-primary/20", textColor: "text-primary" };
      case "withdrawal":
        return { icon: "fa-arrow-right", bgColor: "bg-secondary/20", textColor: "text-secondary" };
      case "game_win":
        return { icon: "fa-gamepad", bgColor: "bg-success/20", textColor: "text-success" };
      case "game_loss":
        return { icon: "fa-gamepad", bgColor: "bg-danger/20", textColor: "text-danger" };
      case "subscription":
        return { icon: "fa-crown", bgColor: "bg-secondary/20", textColor: "text-secondary" };
      case "referral":
        return { icon: "fa-users", bgColor: "bg-accent/20", textColor: "text-accent" };
      default:
        return { icon: "fa-exchange-alt", bgColor: "bg-gray-700", textColor: "text-gray-400" };
    }
  };

  return (
    <Layout title="Wallet">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-gray-400">Manage your funds, deposits, and withdrawals</p>
      </div>

      {/* Wallet Card */}
      <div className="mb-8">
        <WalletCard />
      </div>

      {/* Transactions */}
      <Card className="bg-darkblue">
        <CardHeader>
          <CardTitle className="text-white">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full md:w-[500px] grid-cols-5">
              <TabsTrigger value="transactions">All</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="others">Others</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="pt-4">
              {renderTransactionTable(filterTransactions("all"))}
            </TabsContent>
            
            <TabsContent value="deposits" className="pt-4">
              {renderTransactionTable(filterTransactions("deposit"))}
            </TabsContent>
            
            <TabsContent value="withdrawals" className="pt-4">
              {renderTransactionTable(filterTransactions("withdrawal"))}
            </TabsContent>
            
            <TabsContent value="games" className="pt-4">
              {renderTransactionTable([
                ...filterTransactions("game_win"),
                ...filterTransactions("game_loss")
              ])}
            </TabsContent>
            
            <TabsContent value="others" className="pt-4">
              {renderTransactionTable([
                ...filterTransactions("subscription"),
                ...filterTransactions("referral")
              ])}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Layout>
  );

  function renderTransactionTable(filteredTransactions: Transaction[]) {
    if (isLoading) {
      return (
        <div className="animate-pulse">
          <div className="h-10 bg-neutral/40 w-full mb-2 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral/40 w-full mb-2 rounded"></div>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const { icon, bgColor, textColor } = getTransactionDetails(tx.type);
                const isPositive = tx.amount > 0;
                
                return (
                  <tr key={tx.id} className="border-b border-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-2`}>
                          <i className={`fas ${icon} ${textColor}`}></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white capitalize">
                            {tx.type.replace("_", " ")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {tx.description || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${tx.status === 'completed' ? 'bg-success/20 text-success' : 
                         tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                         'bg-danger/20 text-danger'}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
