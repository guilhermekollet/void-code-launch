
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouteTitle } from "@/hooks/useRouteTitle";

export function Header() {
  const { signOut } = useAuth();
  const title = useRouteTitle();

  return (
    <header className="flex h-16 items-center border-b bg-white px-4 md:px-6" style={{ borderColor: '#DEDEDE' }}>
      <SidebarTrigger className="h-10 w-10 text-[#121212] hover:bg-[#F1F5F9] [&>svg]:stroke-[#121212]" />
      <div className="flex-1 text-center">
        <h1 className="text-xl font-semibold text-[#121212]">{title}</h1>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        className="text-[#121212] hover:bg-[#F1F5F9]"
      >
        <LogOut className="h-5 w-5" style={{ stroke: '#121212' }} />
      </Button>
    </header>
  );
}