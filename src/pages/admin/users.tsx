import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}`, { role });
    },
    onSuccess: () => {
      toast({
        title: "User role updated",
        description: "The user's role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term
  const filteredUsers = users
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  // Open user details dialog
  const handleUserDetails = (user: User) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  // Update user role
  const handleRoleChange = (role: string) => {
    if (selectedUser) {
      updateUserRoleMutation.mutate({ userId: selectedUser.id, role });
    }
  };

  return (
    <Layout title="Admin - Users">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">Manage platform users and their permissions</p>
      </div>

      <Card className="bg-darkblue mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search users by name, username or email..."
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
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90">
                <i className="fas fa-plus mr-2"></i> Add User
              </Button>
              <Button variant="outline" className="border-gray-700 text-white">
                <i className="fas fa-download mr-2"></i> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-darkblue">
        <CardHeader>
          <CardTitle className="text-white">User List</CardTitle>
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold mr-3">
                              {user.fullName?.charAt(0) || user.username.charAt(0)}
                            </div>
                            <div className="text-sm font-medium text-white">
                              {user.fullName || user.username}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">@{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{user.email || "—"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${user.role === "admin" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/90 hover:bg-primary/10"
                            onClick={() => handleUserDetails(user)}
                          >
                            <i className="fas fa-eye mr-1"></i> View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        {searchTerm
                          ? "No users match your search criteria"
                          : "No users found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="bg-darkblue border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                View and manage user information
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-3xl font-bold mb-3">
                {selectedUser.fullName?.charAt(0) || selectedUser.username.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-white">
                {selectedUser.fullName || selectedUser.username}
              </h3>
              <p className="text-gray-400">@{selectedUser.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-neutral/20 p-4 rounded-lg">
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">ID</p>
                <p className="text-white">{selectedUser.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Role</p>
                <Select
                  defaultValue={selectedUser.role}
                  onValueChange={handleRoleChange}
                  disabled={updateUserRoleMutation.isPending}
                >
                  <SelectTrigger className="bg-neutral border-gray-700 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{selectedUser.email || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Phone</p>
                <p className="text-white">{selectedUser.phone || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Joined</p>
                <p className="text-white">
                  {format(new Date(selectedUser.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-success">Active</p>
              </div>
            </div>

            <DialogFooter className="flex space-x-2 mt-4">
              <Button
                variant="destructive"
                className="flex-1"
              >
                <i className="fas fa-ban mr-2"></i> Suspend User
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 flex-1"
                onClick={() => window.location.href = `/admin/users/${selectedUser.id}`}
              >
                <i className="fas fa-edit mr-2"></i> Edit Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
