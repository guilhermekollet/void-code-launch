
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { AddTransactionFAB } from "@/components/AddTransaction/AddTransactionFAB";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 bg-[#FEFEFE] min-h-screen">
          {children}
        </main>
        <AddTransactionFAB />
      </SidebarInset>
    </SidebarProvider>
  );
}
