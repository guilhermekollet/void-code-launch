import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Crown, RefreshCcw, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreateCheckout, useCustomerPortal, useRefreshSubscription } from "@/hooks/useSubscriptionMutations";
export default function Assinatura() {
  const {
    data: subscription,
    isLoading
  } = useSubscription();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const refreshSubscription = useRefreshSubscription();
  const isPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active';
  const isFree = !isPremium;
  const handleUpgrade = () => {
    createCheckout.mutate('premium');
  };
  const handleManageSubscription = () => {
    customerPortal.mutate();
  };
  const handleRefresh = () => {
    refreshSubscription.mutate();
  };
  if (isLoading) {
    return <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Assinatura</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seu plano e acesse funcionalidades premium
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshSubscription.isPending}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshSubscription.isPending ? 'animate-spin' : ''}`} />
          Atualizar Status
        </Button>
      </div>

      {/* Status Atual */}
      <Card className="mb-8">
        
        {isPremium && <CardContent>
            <Button onClick={handleManageSubscription} disabled={customerPortal.isPending} className="w-full sm:w-auto">
              <CreditCard className="h-4 w-4 mr-2" />
              {customerPortal.isPending ? 'Carregando...' : 'Gerenciar Assinatura'}
            </Button>
          </CardContent>}
      </Card>

      {/* Comparação de Planos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plano Free */}
        <Card className={`relative ${isFree ? 'ring-2 ring-blue-500' : ''}`}>
          {isFree && <div className="absolute top-4 right-4">
              <Badge variant="default">Plano Atual</Badge>
            </div>}
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
            <CardDescription>Ideal para começar</CardDescription>
            <div className="text-3xl font-bold">R$ 0</div>
            <div className="text-sm text-gray-500">por mês</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Até 50 transações por mês</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">3 categorias personalizadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Relatórios básicos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">5 despesas recorrentes</span>
              </div>
            </div>
            <Separator />
            <Button variant="outline" className="w-full" disabled={isFree}>
              {isFree ? 'Plano Atual' : 'Fazer Downgrade'}
            </Button>
          </CardContent>
        </Card>

        {/* Plano Premium */}
        <Card className={`relative ${isPremium ? 'ring-2 ring-yellow-500' : 'border-yellow-200'}`}>
          {isPremium && <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-500">Plano Atual</Badge>
            </div>}
          {!isPremium && <div className="absolute top-4 right-4">
              <Badge variant="secondary">Recomendado</Badge>
            </div>}
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Premium
            </CardTitle>
            <CardDescription>Para usuários avançados</CardDescription>
            <div className="text-3xl font-bold">R$ 29,90</div>
            <div className="text-sm text-gray-500">por mês</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Transações ilimitadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Categorias ilimitadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Relatórios avançados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Despesas recorrentes ilimitadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Metas financeiras avançadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Alertas personalizados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Suporte prioritário</span>
              </div>
            </div>
            <Separator />
            <Button className="w-full" onClick={isPremium ? handleManageSubscription : handleUpgrade} disabled={createCheckout.isPending || customerPortal.isPending}>
              {isPremium ? customerPortal.isPending ? 'Carregando...' : 'Gerenciar Assinatura' : createCheckout.isPending ? 'Processando...' : 'Assinar Premium'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      
    </div>;
}