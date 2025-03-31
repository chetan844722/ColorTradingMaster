import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Subscription } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Form schema for subscription
const subscriptionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  dailyReward: z.coerce.number().min(1, "Daily reward must be at least 1"),
  totalReward: z.coerce.number().min(1, "Total reward must be at least 1"),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 day"),
  features: z.string().transform(value => value.split('\n').filter(f => f.trim().length > 0)),
  isActive: z.boolean().default(true),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Fetch subscriptions
  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Form for creating subscription
  const createForm = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      price: 0,
      dailyReward: 0,
      totalReward: 0,
      duration: 7,
      features: "",
      isActive: true,
    },
  });

  // Form for editing subscription
  const editForm = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      price: 0,
      dailyReward: 0,
      totalReward: 0,
      duration: 7,
      features: "",
      isActive: true,
    },
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      return apiRequest("POST", "/api/admin/subscriptions", data);
    },
    onSuccess: () => {
      toast({
        title: "Subscription created",
        description: "The subscription plan has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SubscriptionFormValues }) => {
      return apiRequest("PUT", `/api/admin/subscriptions/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "The subscription plan has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create form submission
  const onCreateSubmit = (values: SubscriptionFormValues) => {
    createSubscriptionMutation.mutate(values);
  };

  // Handle edit form submission
  const onEditSubmit = (values: SubscriptionFormValues) => {
    if (selectedSubscription) {
      updateSubscriptionMutation.mutate({
        id: selectedSubscription.id,
        data: values,
      });
    }
  };

  // Open edit dialog and populate form
  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    
    editForm.reset({
      name: subscription.name,
      price: subscription.price,
      dailyReward: subscription.dailyReward,
      totalReward: subscription.totalReward,
      duration: subscription.duration,
      features: Array.isArray(subscription.features) ? subscription.features.join('\n') : "",
      isActive: subscription.isActive,
    });
    
    setEditDialogOpen(true);
  };

  // Calculate ROI (Return on Investment)
  const calculateROI = (price: number, totalReward: number) => {
    return ((totalReward - price) / price) * 100;
  };

  return (
    <Layout title="Admin - Subscriptions">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Subscription Management</h1>
        <p className="text-gray-400">Manage platform subscription plans and rewards</p>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => setCreateDialogOpen(true)}
        >
          <i className="fas fa-plus mr-2"></i> Create New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-darkblue animate-pulse">
              <CardHeader>
                <div className="h-6 bg-neutral/60 w-1/3 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-neutral/60 w-1/2 rounded mb-4"></div>
                <div className="h-4 bg-neutral/60 w-3/4 rounded mb-2"></div>
                <div className="h-4 bg-neutral/60 w-2/3 rounded mb-4"></div>
                <div className="space-y-2 mb-5">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-4 bg-neutral/60 rounded"></div>
                  ))}
                </div>
                <div className="h-10 bg-neutral/60 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptions && subscriptions.length > 0 ? (
            subscriptions.map((subscription) => {
              const roi = calculateROI(subscription.price, subscription.totalReward);
              
              return (
                <Card key={subscription.id} className={`bg-darkblue ${!subscription.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">{subscription.name}</CardTitle>
                      <div className={`px-2 py-1 text-xs rounded-full ${subscription.isActive ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-400'}`}>
                        {subscription.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-white font-montserrat">
                        ₹{subscription.price.toLocaleString()}
                      </div>
                      <div className="text-success text-sm font-medium">
                        Daily return: ₹{subscription.dailyReward.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Total return: ₹{subscription.totalReward.toLocaleString()} in {subscription.duration} days
                      </div>
                      <div className="text-primary text-xs mt-1">
                        ROI: {roi.toFixed(0)}%
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm text-gray-300 mb-2">Features:</p>
                      <ul className="space-y-1 text-sm text-gray-400">
                        {Array.isArray(subscription.features) && subscription.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <i className="fas fa-check text-success mr-2 mt-1 text-xs"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => handleEditSubscription(subscription)}
                    >
                      <i className="fas fa-edit mr-2"></i> Edit Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <i className="fas fa-crown text-4xl mb-3"></i>
              <p className="text-xl">No subscription plans available</p>
              <p className="text-sm mt-2">Click the "Create New Plan" button to add a subscription plan</p>
            </div>
          )}
        </div>
      )}

      {/* Create Subscription Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-darkblue border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new subscription plan to the platform
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Basic Plan" 
                          className="bg-neutral border-gray-700 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="bg-neutral border-gray-700 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="bg-neutral border-gray-700 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="dailyReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Reward (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="bg-neutral border-gray-700 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="totalReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Reward (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="bg-neutral border-gray-700 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription className="text-xs text-gray-400">
                          Make this plan available to users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Daily automatic payout&#10;Access to all games&#10;Priority customer support" 
                        className="bg-neutral border-gray-700 text-white min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-400">
                      Enter each feature on a new line. These will be displayed as bullet points.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-white"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      {selectedSubscription && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-darkblue border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription className="text-gray-400">
                Modify the existing subscription plan
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Basic Plan" 
                            className="bg-neutral border-gray-700 text-white" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="bg-neutral border-gray-700 text-white" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="bg-neutral border-gray-700 text-white" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="dailyReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Reward (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="bg-neutral border-gray-700 text-white" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="totalReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Reward (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="bg-neutral border-gray-700 text-white" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            Make this plan available to users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features (one per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Daily automatic payout&#10;Access to all games&#10;Priority customer support" 
                          className="bg-neutral border-gray-700 text-white min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400">
                        Enter each feature on a new line. These will be displayed as bullet points.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 text-white"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={updateSubscriptionMutation.isPending}
                  >
                    {updateSubscriptionMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
