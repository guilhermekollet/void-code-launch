import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { useAIAgentSettings, useUpdateAIAgentSettings } from '@/hooks/useAIAgentSettings';
import { Loader2, Bot } from 'lucide-react';
export function AIAgentSection() {
  const {
    data: settings,
    isLoading
  } = useAIAgentSettings();
  const updateSettings = useUpdateAIAgentSettings();
  const [formData, setFormData] = useState({
    phone_number: '',
    is_enabled: false
  });
  React.useEffect(() => {
    if (settings) {
      setFormData({
        phone_number: settings.phone_number || '',
        is_enabled: settings.is_enabled
      });
    }
  }, [settings]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };
  const handleSwitchChange = (enabled: boolean) => {
    const newFormData = {
      ...formData,
      is_enabled: enabled
    };
    setFormData(newFormData);
    updateSettings.mutate(newFormData);
  };
  if (isLoading) {
    return <Card>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Agente de IA Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Ativar Agente de IA</h3>
            <p className="text-sm text-gray-600 mt-1">
              O agente receberá instruções via WhatsApp e ajudará com suas finanças
            </p>
          </div>
          <IOSSwitch checked={formData.is_enabled} onCheckedChange={handleSwitchChange} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-phone">Número do WhatsApp para o Agente</Label>
            <Input id="agent-phone" value={formData.phone_number} onChange={e => setFormData(prev => ({
            ...prev,
            phone_number: e.target.value
          }))} placeholder="(11) 99999-9999" disabled={!formData.is_enabled} />
            <p className="text-sm text-gray-500">
              Este número receberá instruções e notificações do agente de IA
            </p>
          </div>
          
          <Button type="submit" disabled={updateSettings.isPending || !formData.is_enabled} className="w-full md:w-auto bg-gray-200 hover:bg-gray-100">
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </form>

        {formData.is_enabled && <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona o Agente de IA:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Recebe comandos de voz e texto via WhatsApp</li>
              <li>• Registra transações automaticamente</li>
              <li>• Envia relatórios e lembretes personalizados</li>
              <li>• Responde perguntas sobre suas finanças</li>
            </ul>
          </div>}
      </CardContent>
    </Card>;
}