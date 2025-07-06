
import { BarChart3, CreditCard, Settings, Home, Repeat, MessageCircle, Tag } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import confetti from 'canvas-confetti';

const items = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Transações",
  url: "/transacoes",
  icon: CreditCard
}, {
  title: "Cartões",
  url: "/cartoes",
  icon: CreditCard
}, {
  title: "Recorrentes",
  url: "/recorrentes",
  icon: Repeat
}, {
  title: "Categorias",
  url: "/categorias",
  icon: Tag
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: BarChart3
}, {
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings
}];

const handleBetaClick = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#61710C', '#4a5709', '#92CB0B', '#A8E6CF'],
    startVelocity: 30,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200
  });
};

const handleBolsofyIAClick = () => {
  window.open('https://wa.me/5551995915520', '_blank');
};

export function AppSidebar() {
  return <Sidebar className="border-r bg-white" style={{
    borderColor: '#DEDEDE'
  }}>
      <SidebarHeader className="p-6 bg-white">
        <div className="flex items-center gap-3">
          <img src="/lovable-uploads/549233e8-56e8-49c8-b3d7-3393077d8256.png" alt="Bolsofy Logo" className="h-10 w-auto" />
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
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-4 py-4 text-base font-medium px-[16px] ${
                          isActive 
                            ? 'text-[#61710C] bg-[#F0F8E8]' 
                            : 'text-[#121212] bg-white hover:bg-[#F6F6F6]'
                        }`
                      }
                    >
                      <item.icon className="h-7 w-7" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" className="h-14">
                  <button 
                    onClick={handleBolsofyIAClick}
                    className="flex items-center gap-4 text-[#121212] bg-white hover:bg-[#F6F6F6] py-4 text-base font-medium px-[16px] w-full"
                  >
                    <MessageCircle className="h-7 w-7 text-[#121212]" />
                    <span>Bolsofy IA</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#64748B]">
            ©2025 Bolsofy
          </div>
          <Badge 
            variant="outline" 
            className="bg-transparent border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white cursor-pointer transition-colors"
            onClick={handleBetaClick}
          >
            beta
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>;
}
