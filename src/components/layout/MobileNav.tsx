import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Users, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path
      ? "text-primary"
      : "text-gray-400 hover:text-primary";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background z-50 border-t border-border md:hidden">
      <div className="flex justify-around items-center py-2">
        <Link href="/">
          <div className="flex flex-col items-center px-3 py-1 cursor-pointer">
            <Home className={`h-5 w-5 ${isActive("/")}`} />
            <span className={`text-xs mt-1 ${isActive("/")}`}>Home</span>
          </div>
        </Link>
        
        <Link href="/games">
          <div className="flex flex-col items-center px-3 py-1 cursor-pointer">
            <Gamepad2 className={`h-5 w-5 ${isActive("/games")}`} />
            <span className={`text-xs mt-1 ${isActive("/games")}`}>Games</span>
          </div>
        </Link>
        
        <Link href="/wallet">
          <div className="flex flex-col items-center px-3 py-1 cursor-pointer">
            <Wallet className={`h-5 w-5 ${isActive("/wallet")}`} />
            <span className={`text-xs mt-1 ${isActive("/wallet")}`}>Wallet</span>
          </div>
        </Link>
        
        <Link href="/refer">
          <div className="flex flex-col items-center px-3 py-1 cursor-pointer">
            <Users className={`h-5 w-5 ${isActive("/refer")}`} />
            <span className={`text-xs mt-1 ${isActive("/refer")}`}>Refer</span>
          </div>
        </Link>
        
        <Link href="/profile">
          <div className="flex flex-col items-center px-3 py-1 cursor-pointer">
            <User className={`h-5 w-5 ${isActive("/profile")}`} />
            <span className={`text-xs mt-1 ${isActive("/profile")}`}>Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
