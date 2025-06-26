import { BarChart3, CreditCard, Settings, Home, Repeat } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const items = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Transações",
  url: "/transacoes",
  icon: CreditCard
}, {
  title: "Recorrentes",
  url: "/recorrentes",
  icon: Repeat
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: BarChart3
}, {
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings
}];

export function AppSidebar() {
  return <Sidebar className="border-r bg-white" style={{
    borderColor: '#DEDEDE'
  }}>
      <SidebarHeader className="p-6 bg-white">
        <div className="flex items-center gap-3">
          <img src="/lovable-uploads/c8d5d691-6584-41b6-86ad-82dbbd10c1c5.png" alt="Bolsofy Logo" className="h-10 w-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu style={{
            gap: '10px'
          }}>
              {items.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg" className="h-14">
                    <a href={item.url} className="flex items-center gap-4 text-[#121212] bg-white hover:bg-[#F6F6F6] py-4 text-base font-medium px-[16px]">
                      <item.icon className="h-7 w-7 text-[#121212]" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 bg-white">
        <div className="text-sm text-[#64748B]">
          ©2025 Bolsofy
        </div>
      </SidebarFooter>
    </Sidebar>;
}
