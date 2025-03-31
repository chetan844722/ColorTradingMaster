import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminTransactions() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionDetailsOpen, setTransactionDetailsOpen] = useState(false);

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Update transaction status mutation
  const updateTransactionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/admin/transactions/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Transaction updated",
        description: "The transaction status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setTransactionDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter transactions
  const filteredTransactions = transactions
    ? transactions.filter((tx) => {
        // Search filter
        const searchMatch =
          searchTerm === "" ||
          tx.id.toString().includes(searchTerm) ||
          tx.userId.toString().includes(searchTerm) ||
          (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase()));

        // Type filter
        const typeMatch = typeFilter === "all" || tx.type === typeFilter;

        // Status filter
        const statusMatch = statusFilter === "all" || tx.status === statusFilter;

        return searchMatch && typeMatch && statusMatch;
      })
    : [];

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

  // Open transaction details dialog
  const handleTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDetailsOpen(true);
  };

  // Update transaction status
  const handleStatusChange = (status: string) => {
    if (selectedTransaction) {
      updateTransactionStatusMutation.mutate({
        id: selectedTransaction.id,
        status,
      });
    }
  };

  return (
    <Layout title="Admin - Transactions">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Transaction Management</h1>
        <p className="text-gray-400">Manage and monitor all platform transactions</p>
      </div>

      <Card className="bg-darkblue mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search by transaction ID, user ID or description..."
                className="bg-neutral border-gray-700 text-white pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute top-0 right-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setSearchTerm("")}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] bg-neutral border-gray-700 text-white">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="game_win">Game Win</SelectItem>
                  <SelectItem value="game_loss">Game Loss</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-neutral border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-gray-700 text-white">
                <i className="fas fa-download mr-2"></i> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-darkblue">
        <CardHeader>
          <CardTitle className="text-white">Transaction List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
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
                            <div className="text-sm text-white">#{tx.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{tx.userId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-2`}>
                                <i className={`fas ${icon} ${textColor}`}></i>
                              </div>
                              <div className="text-sm font-medium text-white capitalize">
                                {tx.type.replace("_", " ")}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/90 hover:bg-primary/10"
                              onClick={() => handleTransactionDetails(tx)}
                            >
                              <i className="fas fa-edit mr-1"></i> Manage
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                          ? "No transactions match your filter criteria"
                          : "No transactions found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={transactionDetailsOpen} onOpenChange={setTransactionDetailsOpen}>
          <DialogContent className="bg-darkblue border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                Review and manage transaction status
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full ${getTransactionDetails(selectedTransaction.type).bgColor} flex items-center justify-center mr-3`}>
                    <i className={`fas ${getTransactionDetails(selectedTransaction.type).icon} ${getTransactionDetails(selectedTransaction.type).textColor}`}></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium capitalize">
                      {selectedTransaction.type.replace("_", " ")}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatDate(selectedTransaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${selectedTransaction.amount > 0 ? 'text-success' : 'text-danger'}`}>
                    {selectedTransaction.amount > 0 ? '+' : ''}{selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Transaction ID</p>
                  <p className="text-white">#{selectedTransaction.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">User ID</p>
                  <p className="text-white">{selectedTransaction.userId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Status</p>
                  <Select
                    defaultValue={selectedTransaction.status}
                    onValueChange={handleStatusChange}
                    disabled={updateTransactionStatusMutation.isPending}
                  >
                    <SelectTrigger className="bg-neutral border-gray-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white">
                    {format(new Date(selectedTransaction.createdAt), "MMMM d, yyyy HH:mm:ss")}
                  </p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div className="bg-neutral/20 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Description</p>
                  <p className="text-white">{selectedTransaction.description}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex space-x-2 mt-4">
              {selectedTransaction.type === "withdrawal" && selectedTransaction.status === "pending" && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleStatusChange("rejected")}
                  disabled={updateTransactionStatusMutation.isPending}
                >
                  <i className="fas fa-times mr-2"></i> Reject
                </Button>
              )}
              
              {selectedTransaction.type === "deposit" && selectedTransaction.status === "pending" && (
                <Button
                  className="bg-primary hover:bg-primary/90 flex-1"
                  onClick={() => handleStatusChange("completed")}
                  disabled={updateTransactionStatusMutation.isPending}
                >
                  <i className="fas fa-check mr-2"></i> Approve
                </Button>
              )}
              
              {selectedTransaction.type === "withdrawal" && selectedTransaction.status === "pending" && (
                <Button
                  className="bg-primary hover:bg-primary/90 flex-1"
                  onClick={() => handleStatusChange("completed")}
                  disabled={updateTransactionStatusMutation.isPending}
                >
                  <i className="fas fa-check mr-2"></i> Approve Withdrawal
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
