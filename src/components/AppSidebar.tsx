
import { BarChart3, CreditCard, Settings, Home, Repeat, MessageCircle, Tag, Crown, Star, Circle, Lock } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/Settings/UpgradeModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

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
  icon: BarChart3,
  requiresPremium: true
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
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const getPlanInfo = () => {
    const planType = subscription?.plan_type || 'basic';
    
    console.log('[AppSidebar] Plan info:', { planType, subscription });
    
    switch (planType) {
      case 'premium':
        return { 
          name: 'Premium', 
          color: 'text-white bg-[#61710C]'
        };
      case 'basic':
      default:
        return { 
          name: 'Básico', 
          color: 'text-black bg-[#CFF500]'
        };
    }
  };

  const planInfo = getPlanInfo();
  const isPremium = subscription?.plan_type === 'premium';

  const handlePlanCardClick = () => {
    navigate('/configuracoes');
    if (isMobile) {
      setTimeout(() => setOpen(false), 100);
    }
  };

  const handleBetaClick = () => {
    // Removido confetti - apenas um clique sem ação
  };

  const handleBolsofyIAClick = () => {
    window.open('https://wa.me/5551995915520', '_blank');
  };

  const handleItemClick = (item: any, event: React.MouseEvent) => {
    if (item.requiresPremium && !isPremium) {
      event.preventDefault();
      setUpgradeModalOpen(true);
    } else if (isMobile) {
      // Close sidebar on mobile after navigation
      setTimeout(() => setOpen(false), 100);
    }
  };

  return (
    <>
      <Sidebar className="border-r bg-white" style={{
        borderColor: '#DEDEDE'
      }}>
        <SidebarHeader className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <img src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" alt="Bolsofy Logo" className="h-10 w-auto" />
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
                        onClick={(event) => handleItemClick(item, event)}
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
                        {item.requiresPremium && !isPremium && (
                          <Lock className="h-4 w-4 text-gray-400 ml-auto" />
                        )}
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
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Plano {planInfo.name}</span>
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

      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen} 
      />
    </>
  );
}
