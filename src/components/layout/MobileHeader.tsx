import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Wallet } from "@shared/schema";

interface MobileHeaderProps {
  title?: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  // Fetch wallet data
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ["/api/user/wallet"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <header className="bg-darkblue p-4 flex justify-between items-center md:hidden border-b border-gray-800">
      <Link href="/">
        <a>
          <h1 className="text-xl font-bold text-white font-poppins">
            <span className="text-primary">Color</span>Trade
          </h1>
        </a>
      </Link>
      <div className="flex items-center">
        <Link href="/wallet">
          <a className="px-3 py-1 bg-primary/10 rounded-full flex items-center mr-4">
            <i className="fas fa-wallet text-primary mr-2"></i>
            <span className="font-montserrat font-bold">₹{wallet?.balance.toLocaleString() || '0'}</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <i className="fas fa-bell text-primary"></i>
          </a>
        </Link>
      </div>
    </header>
  );
}
