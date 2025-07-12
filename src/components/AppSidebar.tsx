
import { BarChart3, CreditCard, Settings, Home, Repeat, MessageCircle, Tag, Crown, Star, Circle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
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
  // Enhanced confetti with green and yellow colors for 1.2 seconds
  const colors = ['#61710C', '#92CB0B', '#CFF500', '#FFEB3B'];
  const duration = 1200; // 1.2 seconds
  const end = Date.now() + duration;

  // Multiple confetti bursts
  const frame = () => {
    // Random positions across the screen
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    confetti({
      particleCount: randomInRange(20, 40),
      spread: randomInRange(50, 90),
      origin: { 
        x: randomInRange(0.1, 0.9), 
        y: randomInRange(0.1, 0.7) 
      },
      colors: colors,
      startVelocity: randomInRange(25, 45),
      decay: randomInRange(0.85, 0.95),
      gravity: randomInRange(0.8, 1.2),
      drift: randomInRange(-0.5, 0.5),
      ticks: randomInRange(150, 250),
      scalar: randomInRange(0.8, 1.2)
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // Start with immediate burst
  frame();

  // Additional bursts every 480ms
  const interval = setInterval(() => {
    if (Date.now() >= end) {
      clearInterval(interval);
      return;
    }
    frame();
  }, 480);
};

const handleBolsofyIAClick = () => {
  window.open('https://wa.me/5551995915520', '_blank');
};

export function AppSidebar() {
  const { data: subscription } = useSubscription();

  const getPlanInfo = () => {
    if (!subscription) return { icon: Circle, name: 'Free', color: 'text-gray-500 bg-gray-50' };
    
    switch (subscription.plan_type) {
      case 'premium':
        return { icon: Crown, name: 'Premium', color: 'text-green-700 bg-green-50' };
      case 'basic':
        return { icon: Star, name: 'Básico', color: 'text-blue-700 bg-blue-50' };
      default:
        return { icon: Circle, name: 'Free', color: 'text-gray-500 bg-gray-50' };
    }
  };

  const planInfo = getPlanInfo();
  const PlanIcon = planInfo.icon;

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
                </SidebarMenuItem>)}
              
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
        {/* Plan Status Card */}
        <Card className={`${planInfo.color} border-0 shadow-sm`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <PlanIcon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Plano {planInfo.name}</span>
                <span className="text-xs opacity-70">
                  {subscription?.status === 'active' ? 'Ativo' : 'Trial'}
                </span>
              </div>
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
    </Sidebar>;
}
