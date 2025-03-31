import { useMutation } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionCardProps {
  subscription: Subscription;
  isPopular?: boolean;
}

export default function SubscriptionCard({ subscription, isPopular = false }: SubscriptionCardProps) {
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/user/subscription", { 
        subscriptionId: subscription.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription purchased!",
        description: `You have successfully subscribed to the ${subscription.name} plan.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format features list
  const features = Array.isArray(subscription.features) ? subscription.features : [];

  return (
    <>
      <Card className={`subscription-card bg-darkblue rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:transform hover:scale-103 
        ${isPopular ? 'border border-primary/50 relative' : 'border border-gray-800'}`}>
        
        {isPopular && (
          <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full">
            POPULAR
          </div>
        )}
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white font-bold text-lg">{subscription.name}</h3>
              <p className="text-gray-400 text-sm">{subscription.duration} days return</p>
            </div>
            <div className={`${isPopular ? 'bg-secondary/20' : 'bg-primary/20'} p-2 rounded-lg`}>
              <i className={`fas fa-crown ${isPopular ? 'text-secondary' : 'text-primary'} text-xl`}></i>
            </div>
          </div>
          
          <div className="my-4">
            <div className="text-3xl font-bold text-white font-montserrat">
              ₹{subscription.price.toLocaleString()}
            </div>
            <div className="text-success text-sm font-medium">
              Daily return: ₹{subscription.dailyReward.toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs">
              Total return: ₹{subscription.totalReward.toLocaleString()} in {subscription.duration} days
            </div>
          </div>
          
          <ul className="mb-5 space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-300">
                <i className="fas fa-check text-success mr-2"></i> {feature}
              </li>
            ))}
          </ul>
          
          <Button 
            className={`w-full py-3 ${isPopular ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'} text-white rounded-lg font-medium`}
            onClick={() => setConfirmDialogOpen(true)}
          >
            Subscribe Now
          </Button>
        </div>
      </Card>

      {/* Confirm Purchase Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-darkblue border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription className="text-gray-400">
              You are about to purchase the {subscription.name} plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <div className="flex justify-between items-center">
              <span>Plan Price:</span>
              <span className="font-bold">₹{subscription.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Daily Reward:</span>
              <span className="text-success">₹{subscription.dailyReward.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Duration:</span>
              <span>{subscription.duration} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Expected Return:</span>
              <span className="text-success font-bold">₹{subscription.totalReward.toLocaleString()}</span>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              className={`${isPopular ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'}`}
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
