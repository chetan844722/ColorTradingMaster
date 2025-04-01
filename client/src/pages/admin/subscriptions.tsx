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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  PencilIcon, 
  PlusCircle, 
  ToggleLeft, 
  ToggleRight, 
  TrashIcon,
  AlertCircle 
} from "lucide-react";
import { Subscription, UserSubscription } from "@shared/schema";

export default function AdminSubscriptions() {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    dailyReward: 0,
    totalReward: 0,
    duration: 7,
    features: [""],
    isActive: true
  });
  const { toast } = useToast();

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/subscriptions");
      return await res.json();
    },
  });

  // Fetch active subscriptions for users
  const { data: userSubscriptions = [] } = useQuery<UserSubscription[]>({
    queryKey: ["/api/admin/user-subscriptions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/user-subscriptions");
      return await res.json();
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: Partial<Subscription> & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/admin/subscriptions/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "The subscription has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setSelectedSubscription(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: Omit<Subscription, "id">) => {
      const res = await apiRequest("POST", "/api/admin/subscriptions", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Created",
        description: "The new subscription has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setIsCreating(false);
      setForm({
        name: "",
        price: 0,
        dailyReward: 0,
        totalReward: 0,
        duration: 7,
        features: [""],
        isActive: true
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/subscriptions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Deleted",
        description: "The subscription has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form change for editing or creating
  const handleFormChange = (field: string, value: any) => {
    if (isCreating) {
      setForm(prev => ({ ...prev, [field]: value }));
    } else if (selectedSubscription) {
      setSelectedSubscription(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  // Handle features change
  const handleFeatureChange = (index: number, value: string) => {
    if (isCreating) {
      const updatedFeatures = [...form.features];
      updatedFeatures[index] = value;
      setForm(prev => ({ ...prev, features: updatedFeatures }));
    } else if (selectedSubscription) {
      const updatedFeatures = [...selectedSubscription.features];
      updatedFeatures[index] = value;
      setSelectedSubscription(prev => prev ? { ...prev, features: updatedFeatures } : null);
    }
  };

  // Add a new feature field
  const addFeatureField = () => {
    if (isCreating) {
      setForm(prev => ({ ...prev, features: [...prev.features, ""] }));
    } else if (selectedSubscription) {
      setSelectedSubscription(prev => 
        prev ? { ...prev, features: [...prev.features, ""] } : null
      );
    }
  };

  // Remove a feature field
  const removeFeatureField = (index: number) => {
    if (isCreating) {
      const updatedFeatures = [...form.features];
      updatedFeatures.splice(index, 1);
      setForm(prev => ({ ...prev, features: updatedFeatures }));
    } else if (selectedSubscription) {
      const updatedFeatures = [...selectedSubscription.features];
      updatedFeatures.splice(index, 1);
      setSelectedSubscription(prev => 
        prev ? { ...prev, features: updatedFeatures } : null
      );
    }
  };

  // Count active users for each subscription
  const getActiveUsersCount = (subscriptionId: number) => {
    return userSubscriptions.filter(us => 
      us.subscriptionId === subscriptionId && 
      new Date(us.expiresAt) > new Date()
    ).length;
  };

  // Handle save operation
  const handleSave = () => {
    if (isCreating) {
      createSubscriptionMutation.mutate(form);
    } else if (selectedSubscription) {
      updateSubscriptionMutation.mutate(selectedSubscription);
    }
  };

  // Toggle subscription active status
  const toggleSubscriptionStatus = (subscription: Subscription) => {
    updateSubscriptionMutation.mutate({
      id: subscription.id,
      isActive: !subscription.isActive
    });
  };

  return (
    <Layout title="Admin - Subscriptions">
      <div className="container mx-auto p-4">
        <Card className="w-full shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Subscription Management</CardTitle>
              <CardDescription>Manage subscription plans and pricing</CardDescription>
            </div>
            <Button onClick={() => {
              setIsCreating(true);
              setSelectedSubscription(null);
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price (₹)</TableHead>
                      <TableHead>Daily Reward (₹)</TableHead>
                      <TableHead>Total Reward (₹)</TableHead>
                      <TableHead>Duration (days)</TableHead>
                      <TableHead>Active Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{subscription.name}</TableCell>
                        <TableCell>{subscription.price}</TableCell>
                        <TableCell>{subscription.dailyReward}</TableCell>
                        <TableCell>{subscription.totalReward}</TableCell>
                        <TableCell>{subscription.duration}</TableCell>
                        <TableCell>{getActiveUsersCount(subscription.id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {subscription.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                                Inactive
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleSubscriptionStatus(subscription)}
                            >
                              {subscription.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setIsCreating(false);
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                if (getActiveUsersCount(subscription.id) > 0) {
                                  toast({
                                    title: "Cannot Delete",
                                    description: "This subscription has active users. Deactivate it instead.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                deleteSubscriptionMutation.mutate(subscription.id);
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
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
                  <p className="text-muted-foreground">No subscriptions found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Subscription Dialog */}
      <Dialog open={isCreating || !!selectedSubscription} onOpenChange={(open) => {
        if (!open) {
          setSelectedSubscription(null);
          setIsCreating(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create New Subscription" : "Edit Subscription"}</DialogTitle>
            <DialogDescription>
              {isCreating 
                ? "Create a new subscription plan for users" 
                : "Update the subscription details"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Subscription Name"
                  value={isCreating ? form.name : selectedSubscription?.name || ""}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="1000"
                  value={isCreating ? form.price : selectedSubscription?.price || 0}
                  onChange={(e) => handleFormChange("price", Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyReward">Daily Reward (₹)</Label>
                <Input
                  id="dailyReward"
                  type="number"
                  placeholder="600"
                  value={isCreating ? form.dailyReward : selectedSubscription?.dailyReward || 0}
                  onChange={(e) => handleFormChange("dailyReward", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalReward">Total Reward (₹)</Label>
                <Input
                  id="totalReward"
                  type="number"
                  placeholder="4200"
                  value={isCreating ? form.totalReward : selectedSubscription?.totalReward || 0}
                  onChange={(e) => handleFormChange("totalReward", Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="7"
                  value={isCreating ? form.duration : selectedSubscription?.duration || 7}
                  onChange={(e) => handleFormChange("duration", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isCreating ? form.isActive : selectedSubscription?.isActive || false}
                    onCheckedChange={(checked) => handleFormChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Features</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addFeatureField}
                  type="button"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
              
              <div className="space-y-2">
                {(isCreating ? form.features : selectedSubscription?.features || []).map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Feature ${index + 1}`}
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                    />
                    {(isCreating ? form.features : selectedSubscription?.features || []).length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFeatureField(index)}
                        type="button"
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSubscription(null);
                setIsCreating(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={
                createSubscriptionMutation.isPending || 
                updateSubscriptionMutation.isPending
              }
            >
              {(createSubscriptionMutation.isPending || updateSubscriptionMutation.isPending)
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}