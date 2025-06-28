import React from "react";
import { Sidebar } from "flowbite-react";
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
    <Sidebar aria-label="Application sidebar" className="h-full" {...props}>
      <Sidebar.Items>
        <div className="flex items-center justify-center py-4 border-b border-gray-200">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.user_metadata?.avatar_url as string} />
            <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase() || '??'}</AvatarFallback>
          </Avatar>
        </div>
        <Sidebar.ItemGroup>
          {menuItems.map((item) => (
            <Sidebar.Item
              key={item.title}
              href="#"
              active={location.pathname === item.url}
              onClick={() => handleNavigation(item.url)}
              icon={item.icon}
            >
              {item.title}
            </Sidebar.Item>
          ))}
        </Sidebar.ItemGroup>
        <Sidebar.ItemGroup>
          <Sidebar.Item
            href="#"
            onClick={() => handleNavigation("/configuracoes")}
            icon={Settings}
          >
            Configurações
          </Sidebar.Item>
          <Sidebar.Item
            href="#"
            onClick={handleSignOut}
            icon={LogOut}
          >
            Sair
          </Sidebar.Item>
        </Sidebar.ItemGroup>
        {!isPremiumUser && (
          <div className="p-4 mt-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              Desbloqueie recursos premium e tenha uma experiência completa!
            </p>
            <Sidebar.Item
              href="#"
              onClick={() => handleNavigation("/assinatura")}
              className="mt-2 text-blue-500 hover:text-blue-700"
            >
              Assinar
            </Sidebar.Item>
          </div>
        )}
      </Sidebar.Items>
    </Sidebar>
  );
}
