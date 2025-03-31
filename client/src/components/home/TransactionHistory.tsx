import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

export default function TransactionHistory() {
  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    const today = new Date();
    
    if (dateObj.toDateString() === today.toDateString()) {
      return `Today, ${format(dateObj, "HH:mm")}`;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (dateObj.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${format(dateObj, "HH:mm")}`;
      } else {
        return format(dateObj, "MMM d, HH:mm");
      }
    }
  };

  // Get icon and color based on transaction type
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

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold font-poppins mb-4 text-white flex items-center">
          <i className="fas fa-history text-secondary mr-2"></i> Recent Transactions
        </h2>
        <div className="bg-darkblue rounded-xl overflow-hidden animate-pulse">
          <div className="h-10 bg-neutral/60 w-full"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-800">
              <div className="flex justify-between">
                <div className="flex">
                  <div className="h-10 w-10 bg-neutral/60 rounded-full mr-3"></div>
                  <div>
                    <div className="h-5 bg-neutral/60 w-24 mb-2 rounded"></div>
                    <div className="h-4 bg-neutral/60 w-16 rounded"></div>
                  </div>
                </div>
                <div>
                  <div className="h-5 bg-neutral/60 w-16 mb-2 rounded"></div>
                  <div className="h-4 bg-neutral/60 w-24 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold font-poppins mb-4 text-white flex items-center">
        <i className="fas fa-history text-secondary mr-2"></i> Recent Transactions
      </h2>
      <div className="bg-darkblue rounded-xl overflow-hidden">
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
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx) => {
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
        <div className="p-4 border-t border-gray-800 flex justify-center">
          <Link href="/history">
            <a className="text-primary hover:text-primary/80 text-sm font-medium">
              View All Transactions
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
