
import React from "react";
import {
  Home,
  Receipt,
  BarChart3,
  RotateCcw,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: subscription } = useSubscription();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const isPremiumUser = subscription?.status === 'active' || subscription?.status === 'trialing';

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Transações",
      url: "/transacoes",
      icon: Receipt,
    },
    {
      title: "Cartões",
      url: "/cartoes",
      icon: CreditCard,
    },
    {
      title: "Recorrentes",
      url: "/recorrentes",
      icon: RotateCcw,
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: BarChart3,
    },
  ];

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center py-4 border-b border-gray-200">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.user_metadata?.avatar_url as string} />
            <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase() || '??'}</AvatarFallback>
          </Avatar>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={location.pathname === item.url}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigation("/configuracoes")}
                  isActive={location.pathname === "/configuracoes"}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!isPremiumUser && (
        <SidebarFooter>
          <div className="p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800 mb-2">
              Desbloqueie recursos premium e tenha uma experiência completa!
            </p>
            <Button
              onClick={() => handleNavigation("/assinatura")}
              variant="outline"
              size="sm"
              className="w-full text-blue-500 hover:text-blue-700"
            >
              Assinar
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
