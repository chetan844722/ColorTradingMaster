import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import MobileHeader from "./MobileHeader";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-neutral">
      {/* Mobile Header */}
      <MobileHeader title={title} />
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="md:ml-64 flex-grow pb-16 md:pb-0">
        <div className="p-4 md:p-8 bg-neutral">
          {children}
        </div>
      </div>
    </div>
  );
}
