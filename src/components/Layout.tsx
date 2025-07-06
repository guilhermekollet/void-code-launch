
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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 p-4 md:p-6 min-h-screen bg-gray-50">
            {children}
          </main>
          <AddTransactionFAB />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
