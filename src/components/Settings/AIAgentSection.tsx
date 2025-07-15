
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { MessageCircle } from "lucide-react";
import { useAIAgentSettings, useUpdateAIAgentSettings } from "@/hooks/useAIAgentSettings";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";

export function AIAgentSection() {
  const { data: aiSettings } = useAIAgentSettings();
  const { data: userProfile } = useUserProfile();
  const updateAISettings = useUpdateAIAgentSettings();
  const updateUserProfile = useUpdateUserProfile();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    // Prioridade: 1º AI settings, 2º user profile phone
    if (aiSettings?.phone_number) {
      setPhoneNumber(aiSettings.phone_number);
      setIsEnabled(aiSettings.is_enabled);
    } else if (userProfile?.phone_number) {
      // Auto-preencher com o telefone da tabela users
      setPhoneNumber(userProfile.phone_number);
      setIsEnabled(aiSettings?.is_enabled || false);
    }
    
    if (aiSettings) {
      setIsEnabled(aiSettings.is_enabled);
    }
  }, [aiSettings, userProfile]);

  const handleSave = async () => {
    try {
      // Update AI agent settings
      await updateAISettings.mutateAsync({
        is_enabled: isEnabled,
        phone_number: phoneNumber,
      });

      // Sincronizar o telefone na tabela users se for diferente
      if (userProfile && userProfile.phone_number !== phoneNumber) {
        await updateUserProfile.mutateAsync({
          phone_number: phoneNumber,
        });
      }
    } catch (error) {
      console.error('Error saving AI agent settings:', error);
    }
  };

  const isPending = updateAISettings.isPending || updateUserProfile.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#61710C]" />
          <CardTitle>Agente de IA</CardTitle>
        </div>
        <CardDescription>
          Configure seu assistente pessoal via WhatsApp para controle financeiro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Ativar Agente de IA</Label>
            <p className="text-sm text-gray-500">
              Receba insights e controle suas finanças via WhatsApp
            </p>
          </div>
          <IOSSwitch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp-number" className="text-sm font-medium">
            Número do WhatsApp
          </Label>
          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            placeholder="Insira seu número do WhatsApp"
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            O agente enviará notificações e insights para este número
          </p>
        </div>

        {isEnabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-800">
                  Como funciona o Agente de IA
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Receba resumos diários dos seus gastos</li>
                  <li>• Alertas quando exceder limites de categoria</li>
                  <li>• Insights personalizados sobre seus hábitos</li>
                  <li>• Lembretes de vencimento de cartões</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSave}
          disabled={isPending}
          className="w-full bg-white hover:bg-gray-50 text-black border border-[#E2E8F0]"
        >
          {isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
