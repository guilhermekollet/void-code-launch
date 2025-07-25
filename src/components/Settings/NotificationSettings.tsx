import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useUserProfile";
import { IOSSwitch } from "@/components/ui/ios-switch";

export function NotificationSettings() {
  const { data: userProfile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const handleInsightsToggle = (checked: boolean) => {
    updateProfile.mutate({
      insights_alerts: checked,
    });
  };

  const handleInactiveToggle = (checked: boolean) => {
    updateProfile.mutate({
      inactive_alerts: checked,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#61710C]" />
            <CardTitle>Notificações</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-10"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-10"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#61710C]" />
          <CardTitle>Notificações</CardTitle>
        </div>
        <CardDescription>
          Gerencie suas preferências de notificação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Notificação de Insights</Label>
            <p className="text-xs text-muted-foreground">
              Receba mensagens do Bolsofy com insights financeiros inteligentes.
            </p>
          </div>
          <IOSSwitch
            checked={userProfile?.insights_alerts || false}
            onCheckedChange={handleInsightsToggle}
            disabled={updateProfile.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Notificação de Atividade</Label>
            <p className="text-xs text-muted-foreground">
              Receba lembretes para ajudar a manter suas despesas sempre registradas.
            </p>
          </div>
          <IOSSwitch
            checked={userProfile?.inactive_alerts || false}
            onCheckedChange={handleInactiveToggle}
            disabled={updateProfile.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}