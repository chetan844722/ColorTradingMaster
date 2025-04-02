import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, User, Game, Subscription } from "@shared/schema";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminDashboard() {
  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch games
  const { data: games, isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch subscriptions
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Calculate stats
  const calculateStats = () => {
    if (!transactions) return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      pendingTransactions: 0,
      revenue: 0
    };

    const totalDeposits = transactions
      .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalWithdrawals = transactions
      .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const pendingTransactions = transactions
      .filter(tx => tx.status === 'pending').length;

    // Revenue (simplified calculation - in reality this would be more complex)
    const gameLosses = transactions
      .filter(tx => tx.type === 'game_loss' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const gameWins = transactions
      .filter(tx => tx.type === 'game_win' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const revenue = gameLosses - gameWins;

    return { totalDeposits, totalWithdrawals, pendingTransactions, revenue };
  };

  // Get transaction data for chart
  const getTransactionChartData = () => {
    if (!transactions) return [];

    // Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'MMM dd');
    }).reverse();

    return last7Days.map(day => {
      const depositsAmount = transactions
        .filter(tx => 
          tx.type === 'deposit' && 
          tx.status === 'completed' && 
          format(new Date(tx.createdAt), 'MMM dd') === day
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const withdrawalsAmount = transactions
        .filter(tx => 
          tx.type === 'withdrawal' && 
          tx.status === 'completed' && 
          format(new Date(tx.createdAt), 'MMM dd') === day
        )
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      return {
        name: day,
        deposits: depositsAmount,
        withdrawals: withdrawalsAmount
      };
    });
  };

  // Get game popularity data for pie chart
  const getGamePopularityData = () => {
    if (!transactions || !games) return [];

    const gameIds = games.map(game => game.id);
    const gameBets = {};

    // Count bets per game (simulated - in a real app this would be from actual data)
    gameIds.forEach(id => {
      gameBets[id] = Math.floor(Math.random() * 100) + 20; // Random numbers for demo
    });

    return games.map(game => ({
      name: game.name,
      value: gameBets[game.id] || 0
    }));
  };

  const COLORS = ['#5D3FD3', '#FF6B00', '#00C8FF', '#00C853', '#FF3D57'];

  const stats = calculateStats();
  const transactionChartData = getTransactionChartData();
  const gamePopularityData = getGamePopularityData();
  const isLoading = isLoadingUsers || isLoadingTransactions || isLoadingGames || isLoadingSubscriptions;

  return (
    <Layout title="Admin Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of platform statistics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-darkblue">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i className="fas fa-users text-primary text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  {isLoading ? (
                    <div className="h-8 bg-neutral/40 w-16 rounded animate-pulse"></div>
                  ) : (
                    users?.length || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-darkblue">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mr-4">
                <i className="fas fa-wallet text-accent text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Deposits</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  {isLoading ? (
                    <div className="h-8 bg-neutral/40 w-24 rounded animate-pulse"></div>
                  ) : (
                    `₹${stats.totalDeposits.toLocaleString()}`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-darkblue">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                <i className="fas fa-money-bill-wave text-secondary text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Revenue</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  {isLoading ? (
                    <div className="h-8 bg-neutral/40 w-24 rounded animate-pulse"></div>
                  ) : (
                    `₹${stats.revenue.toLocaleString()}`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-darkblue">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center mr-4">
                <i className="fas fa-clock text-danger text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending Transactions</p>
                <p className="text-white text-2xl font-bold font-montserrat">
                  {isLoading ? (
                    <div className="h-8 bg-neutral/40 w-16 rounded animate-pulse"></div>
                  ) : (
                    stats.pendingTransactions
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-darkblue">
          <CardHeader>
            <CardTitle className="text-white">Transaction Overview</CardTitle>
            <CardDescription>Deposits and withdrawals for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 bg-neutral/40 rounded animate-pulse"></div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={transactionChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #333' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                    />
                    <Legend />
                    <Bar dataKey="deposits" name="Deposits" fill="#5D3FD3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="withdrawals" name="Withdrawals" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-darkblue">
          <CardHeader>
            <CardTitle className="text-white">Game Popularity</CardTitle>
            <CardDescription>Distribution of game plays across platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 bg-neutral/40 rounded animate-pulse"></div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gamePopularityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {gamePopularityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #333' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-darkblue">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription>Latest transactions and platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral/40 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.slice(0, 5).map((tx) => {
                const isDeposit = tx.type === 'deposit';
                const isWithdrawal = tx.type === 'withdrawal';
                
                return (
                  <div key={tx.id} className="flex items-start bg-neutral/20 p-4 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 
                      ${isDeposit ? 'bg-accent/20' : isWithdrawal ? 'bg-secondary/20' : 'bg-primary/20'}`}>
                      <i className={`fas 
                        ${isDeposit ? 'fa-wallet text-accent' : 
                          isWithdrawal ? 'fa-arrow-right text-secondary' : 
                          'fa-gamepad text-primary'}`}>
                      </i>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-400">
                            User #{tx.userId} • {format(new Date(tx.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </p>
                          <p className={`text-xs 
                            ${tx.status === 'completed' ? 'text-success' : 
                              tx.status === 'pending' ? 'text-yellow-500' : 'text-danger'}`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
