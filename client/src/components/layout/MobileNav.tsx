import { Link, useLocation } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path
      ? "text-primary"
      : "text-gray-400 hover:text-primary";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-darkblue z-50 border-t border-gray-800 md:hidden">
      <div className="flex justify-around items-center py-2">
        <Link href="/">
          <a className="flex flex-col items-center px-3 py-1">
            <i className={`fas fa-home text-lg ${isActive("/")}`}></i>
            <span className={`text-xs mt-1 ${isActive("/")}`}>Home</span>
          </a>
        </Link>
        
        <Link href="/games">
          <a className="flex flex-col items-center px-3 py-1">
            <i className={`fas fa-gamepad text-lg ${isActive("/games")}`}></i>
            <span className={`text-xs mt-1 ${isActive("/games")}`}>Games</span>
          </a>
        </Link>
        
        <Link href="/wallet">
          <a className="flex flex-col items-center px-3 py-1">
            <i className={`fas fa-wallet text-lg ${isActive("/wallet")}`}></i>
            <span className={`text-xs mt-1 ${isActive("/wallet")}`}>Wallet</span>
          </a>
        </Link>
        
        <Link href="/refer">
          <a className="flex flex-col items-center px-3 py-1">
            <i className={`fas fa-users text-lg ${isActive("/refer")}`}></i>
            <span className={`text-xs mt-1 ${isActive("/refer")}`}>Refer</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className="flex flex-col items-center px-3 py-1">
            <i className={`fas fa-user text-lg ${isActive("/profile")}`}></i>
            <span className={`text-xs mt-1 ${isActive("/profile")}`}>Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
