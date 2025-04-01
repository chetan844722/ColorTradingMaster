import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle, Timer, Search, Filter, UserCircle } from "lucide-react";
import { Transaction } from "@shared/schema";

export default function AdminTransactions() {
  const [filteredStatus, setFilteredStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/transactions");
      return await res.json();
    }
  });

  // Action to update transaction status
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: number; 
      status: "approved" | "rejected";
    }) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${id}`, 
        { status }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Updated",
        description: "The transaction status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setSelectedTransaction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get User info for a transaction
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    }
  });

  const getUserName = (userId: number) => {
    const user = users.find((u: { id: number; username: string }) => u.id === userId);
    return user ? user.username : `User #${userId}`;
  };

  // Filter transactions based on status and search term
  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = filteredStatus === "all" || transaction.status === filteredStatus;
    const matchesSearch = 
      getUserName(transaction.userId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Sort transactions by date (most recent first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Timer className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Layout title="Admin - Transactions">
      <div className="container mx-auto p-4">
        <Card className="w-full shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Transaction Management</CardTitle>
            <CardDescription>Approve or reject user transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, type, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={filteredStatus}
                  onValueChange={setFilteredStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : sortedTransactions.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            {getUserName(transaction.userId)}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{transaction.type}</TableCell>
                        <TableCell className="text-right font-medium">₹{transaction.amount}</TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.status === "pending" ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTransaction(transaction)}
                                >
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Review Transaction</DialogTitle>
                                  <DialogDescription>
                                    Review and update the status of this transaction.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>User</Label>
                                      <div className="font-medium mt-1">
                                        {selectedTransaction ? getUserName(selectedTransaction.userId) : ''}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Type</Label>
                                      <div className="font-medium capitalize mt-1">
                                        {selectedTransaction?.type}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Amount</Label>
                                      <div className="font-medium mt-1">
                                        ₹{selectedTransaction?.amount}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Date</Label>
                                      <div className="font-medium mt-1">
                                        {selectedTransaction 
                                          ? new Date(selectedTransaction.createdAt).toLocaleString()
                                          : ''}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <DialogFooter className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => selectedTransaction && updateTransactionMutation.mutate({
                                      id: selectedTransaction.id,
                                      status: "rejected"
                                    })}
                                    disabled={updateTransactionMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    variant="default"
                                    onClick={() => selectedTransaction && updateTransactionMutation.mutate({
                                      id: selectedTransaction.id,
                                      status: "approved"
                                    })}
                                    disabled={updateTransactionMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              {transaction.status === "approved" ? "Approved" : "Rejected"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 bg-muted/20 rounded-md">
                <div className="text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}