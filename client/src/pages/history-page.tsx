import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction, GameBet } from "@shared/schema";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch game bets (this would be a real API endpoint in production)
  const { data: gameBets, isLoading: isLoadingBets } = useQuery<GameBet[]>({
    queryKey: ["/api/user/game-bets"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: activeTab === "games",
  });

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

  // Filter transactions based on date and search term
  const filterTransactions = () => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(tx => new Date(tx.createdAt) >= today);
          break;
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(tx => new Date(tx.createdAt) >= weekAgo);
          break;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(tx => new Date(tx.createdAt) >= monthAgo);
          break;
      }
    }

    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.type.toLowerCase().includes(search) || 
        (tx.description && tx.description.toLowerCase().includes(search))
      );
    }

    return filtered;
  };

  return (
    <Layout title="History">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Transaction History</h1>
        <p className="text-gray-400">View your past transactions and game history</p>
      </div>

      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 md:mb-0">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="games">Game History</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px] bg-darkblue text-white border-gray-700">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="Search..."
                className="bg-darkblue text-white border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button variant="ghost" onClick={() => setSearchTerm("")} className="px-2">
                  <i className="fas fa-times text-gray-400"></i>
                </Button>
              )}
            </div>
          </div>
        </div>

        <TabsContent value="transactions">
          <Card className="bg-darkblue">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-neutral/40 w-full mb-2 rounded"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral/40 w-full mb-2 rounded"></div>
                  ))}
                </div>
              ) : (
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
                      {filterTransactions().length > 0 ? (
                        filterTransactions().map((tx) => {
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
                            {searchTerm ? 'No transactions match your search' : 'No transactions found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          <Card className="bg-darkblue">
            <CardHeader>
              <CardTitle className="text-white">Game History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBets ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-neutral/40 w-full mb-2 rounded"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral/40 w-full mb-2 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Game</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bet Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Choice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Result</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Win Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameBets && gameBets.length > 0 ? (
                        gameBets.map((bet) => {
                          return (
                            <tr key={bet.id} className="border-b border-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                                    <i className="fas fa-gamepad text-primary"></i>
                                  </div>
                                  <div className="text-sm font-medium text-white">
                                    Game #{bet.gameRoundId}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">₹{bet.betAmount}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white capitalize">{bet.betChoice}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {bet.isWin !== undefined && (
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${bet.isWin ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                    {bet.isWin ? 'Won' : 'Lost'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-success">
                                  {bet.winAmount ? `₹${bet.winAmount}` : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {formatDate(bet.createdAt)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            <div className="w-16 h-16 bg-neutral/50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <i className="fas fa-dice text-gray-400 text-2xl"></i>
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">No Game History</h3>
                            <p className="text-gray-400">
                              Play some games to see your betting history here
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="bg-darkblue">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i className="fas fa-wallet text-primary text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Deposits</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  ₹{transactions
                    ? transactions
                        .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toLocaleString()
                    : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-darkblue">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mr-4">
                <i className="fas fa-gamepad text-success text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Game Winnings</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  ₹{transactions
                    ? transactions
                        .filter(tx => tx.type === 'game_win' && tx.status === 'completed')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toLocaleString()
                    : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-darkblue">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                <i className="fas fa-arrow-right text-secondary text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Withdrawals</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  ₹{transactions
                    ? Math.abs(
                        transactions
                          .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
                          .reduce((sum, tx) => sum + tx.amount, 0)
                      ).toLocaleString()
                    : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
