import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path
      ? "text-primary"
      : "text-gray-400 hover:text-primary hover:bg-neutral/50";
  };

  return (
    <div className="hidden md:flex fixed h-full bg-darkblue w-64 flex-col z-40">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white font-poppins">
          <span className="text-primary">Color</span>Trade
        </h1>
      </div>
      
      <div className="py-4 flex-grow overflow-y-auto">
        {/* User Navigation */}
        <Link href="/">
          <a className={`flex items-center px-6 py-3 ${isActive("/")}`}>
            <i className="fas fa-home mr-3"></i>
            <span className="font-medium">Home</span>
          </a>
        </Link>
        
        <Link href="/games">
          <a className={`flex items-center px-6 py-3 ${isActive("/games")}`}>
            <i className="fas fa-gamepad mr-3"></i>
            <span className="font-medium">Games</span>
          </a>
        </Link>
        
        <Link href="/wallet">
          <a className={`flex items-center px-6 py-3 ${isActive("/wallet")}`}>
            <i className="fas fa-wallet mr-3"></i>
            <span className="font-medium">Wallet</span>
          </a>
        </Link>
        
        <Link href="/subscription">
          <a className={`flex items-center px-6 py-3 ${isActive("/subscription")}`}>
            <i className="fas fa-crown mr-3"></i>
            <span className="font-medium">Subscription</span>
          </a>
        </Link>
        
        <Link href="/refer">
          <a className={`flex items-center px-6 py-3 ${isActive("/refer")}`}>
            <i className="fas fa-users mr-3"></i>
            <span className="font-medium">Refer & Earn</span>
          </a>
        </Link>
        
        <Link href="/chat">
          <a className={`flex items-center px-6 py-3 ${isActive("/chat")}`}>
            <i className="fas fa-comments mr-3"></i>
            <span className="font-medium">Chat</span>
          </a>
        </Link>
        
        <Link href="/history">
          <a className={`flex items-center px-6 py-3 ${isActive("/history")}`}>
            <i className="fas fa-history mr-3"></i>
            <span className="font-medium">History</span>
          </a>
        </Link>
        
        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="px-6 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">
              Admin Panel
            </div>
            
            <Link href="/admin">
              <a className={`flex items-center px-6 py-3 ${isActive("/admin")}`}>
                <i className="fas fa-tachometer-alt mr-3"></i>
                <span className="font-medium">Dashboard</span>
              </a>
            </Link>
            
            <Link href="/admin/users">
              <a className={`flex items-center px-6 py-3 ${isActive("/admin/users")}`}>
                <i className="fas fa-users-cog mr-3"></i>
                <span className="font-medium">Users</span>
              </a>
            </Link>
            
            <Link href="/admin/transactions">
              <a className={`flex items-center px-6 py-3 ${isActive("/admin/transactions")}`}>
                <i className="fas fa-money-bill-wave mr-3"></i>
                <span className="font-medium">Transactions</span>
              </a>
            </Link>
            
            <Link href="/admin/subscriptions">
              <a className={`flex items-center px-6 py-3 ${isActive("/admin/subscriptions")}`}>
                <i className="fas fa-tag mr-3"></i>
                <span className="font-medium">Subscriptions</span>
              </a>
            </Link>
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center px-2 py-2 rounded-lg bg-neutral/30">
          <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 flex-1">
            <p className="font-medium text-sm text-white">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-gray-400">
              {user?.role === 'admin' ? 'Admin' : 'User'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white"
            disabled={logoutMutation.isPending}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
