
import { BarChart3, CreditCard, Settings, Home, Repeat, MessageCircle, Tag, Crown, Star, Circle } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";

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

// Função vazia para o beta badge (sem confetti)
const handleBetaClick = () => {
  // Removido confetti - apenas um clique sem ação
};

const handleBolsofyIAClick = () => {
  window.open('https://wa.me/5551995915520', '_blank');
};

export function AppSidebar() {
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();

  const getPlanInfo = () => {
    const planType = subscription?.plan_type || 'basic';
    const status = subscription?.status || 'active';
    
    console.log('[AppSidebar] Plan info:', { planType, status, subscription });
    
    switch (planType) {
      case 'premium':
        return { 
          name: 'Premium', 
          color: 'text-white bg-[#61710C]',
          status: status === 'active' ? 'Ativo' : 'Inativo'
        };
      case 'basic':
      default:
        return { 
          name: 'Básico', 
          color: 'text-black bg-[#CFF500]',
          status: status === 'active' ? 'Ativo' : 'Inativo'
        };
    }
  };

  const planInfo = getPlanInfo();

  const handlePlanCardClick = () => {
    navigate('/configuracoes');
  };

  return (
    <Sidebar className="border-r bg-white" style={{
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
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg" className="h-14">
                    <NavLink 
                      to={item.url} 
                      end
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
                </SidebarMenuItem>
              ))}
              
              {/* Bolsofy IA Button */}
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
      <SidebarFooter className="p-6 bg-white space-y-4">
        {/* Enhanced Plan Status Card */}
        <Card 
          className={`${planInfo.color} border-0 shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={handlePlanCardClick}
        >
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Plano {planInfo.name}</span>
              <span className="text-xs opacity-80">
                {planInfo.status}
              </span>
              <span className="text-xs opacity-70">
                Clique para gerenciar
              </span>
            </div>
          </CardContent>
        </Card>

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
    </Sidebar>
  );
}
