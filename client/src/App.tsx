import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Analytics } from '@vercel/analytics/react';

// Pages
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import GamesPage from "@/pages/games-page";
import WalletPage from "@/pages/wallet-page";
import SubscriptionPage from "@/pages/subscription-page";
import ReferralPage from "@/pages/referral-page";
import ChatPage from "@/pages/chat-page";
import HistoryPage from "@/pages/history-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminTransactions from "@/pages/admin/transactions";
import AdminSubscriptions from "@/pages/admin/subscriptions";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* User Routes */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/games" component={GamesPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/refer" component={ReferralPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/transactions" component={AdminTransactions} />
      <ProtectedRoute path="/admin/subscriptions" component={AdminSubscriptions} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
