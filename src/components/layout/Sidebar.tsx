import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Gamepad2, 
  Wallet, 
  Crown, 
  Users, 
  MessageSquare, 
  Clock, 
  LayoutDashboard, 
  UserCog, 
  CreditCard, 
  Tag, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Check for admin role with safety
  const isAdmin = user?.username === "admin";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path
      ? "text-primary"
      : "text-gray-400 hover:text-primary hover:bg-neutral/50";
  };

  return (
    <div className="hidden md:flex fixed h-full bg-card w-64 flex-col z-40 border-r border-border">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">
          <span className="text-primary">Color</span>Trade
        </h1>
      </div>
      
      <div className="py-4 flex-grow overflow-y-auto">
        {/* User Navigation */}
        <Link href="/">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/")}`}>
            <Home className="h-4 w-4 mr-3" />
            <span className="font-medium">Home</span>
          </div>
        </Link>
        
        <Link href="/games">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/games")}`}>
            <Gamepad2 className="h-4 w-4 mr-3" />
            <span className="font-medium">Games</span>
          </div>
        </Link>
        
        <Link href="/wallet">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/wallet")}`}>
            <Wallet className="h-4 w-4 mr-3" />
            <span className="font-medium">Wallet</span>
          </div>
        </Link>
        
        <Link href="/subscription">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/subscription")}`}>
            <Crown className="h-4 w-4 mr-3" />
            <span className="font-medium">Subscription</span>
          </div>
        </Link>
        
        <Link href="/refer">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/refer")}`}>
            <Users className="h-4 w-4 mr-3" />
            <span className="font-medium">Refer & Earn</span>
          </div>
        </Link>
        
        <Link href="/chat">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/chat")}`}>
            <MessageSquare className="h-4 w-4 mr-3" />
            <span className="font-medium">Chat</span>
          </div>
        </Link>
        
        <Link href="/history">
          <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/history")}`}>
            <Clock className="h-4 w-4 mr-3" />
            <span className="font-medium">History</span>
          </div>
        </Link>
        
        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="px-6 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase">
              Admin Panel
            </div>
            
            <Link href="/admin">
              <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/admin")}`}>
                <LayoutDashboard className="h-4 w-4 mr-3" />
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
            
            <Link href="/admin/users">
              <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/admin/users")}`}>
                <UserCog className="h-4 w-4 mr-3" />
                <span className="font-medium">Users</span>
              </div>
            </Link>
            
            <Link href="/admin/transactions">
              <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/admin/transactions")}`}>
                <CreditCard className="h-4 w-4 mr-3" />
                <span className="font-medium">Transactions</span>
              </div>
            </Link>
            
            <Link href="/admin/subscriptions">
              <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive("/admin/subscriptions")}`}>
                <Tag className="h-4 w-4 mr-3" />
                <span className="font-medium">Subscriptions</span>
              </div>
            </Link>
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center px-2 py-2 rounded-lg bg-muted/50">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 flex-1">
            <p className="font-medium text-sm text-foreground">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Admin' : 'User'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
