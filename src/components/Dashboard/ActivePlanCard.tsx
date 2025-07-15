
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function ActivePlanCard() {
  const { data: subscription } = useSubscription();

  if (!subscription || subscription.plan_type === 'free') {
    return (
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#121212] text-xl font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-gray-500" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gratuito</h3>
              <p className="text-sm text-gray-600">Recursos básicos</p>
            </div>
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
              Ativo
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'basic':
        return 'Básico';
      case 'premium':
        return 'Premium';
      default:
        return 'Gratuito';
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Star className="h-5 w-5 text-[#CFF500]" />;
      case 'premium':
        return <Crown className="h-5 w-5 text-white" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const isPremium = subscription.plan_type === 'premium';

  return (
    <Card className={`shadow-sm ${isPremium ? 'bg-[#61710C] border-[#61710C]' : 'bg-white border-[#E2E8F0]'}`}>
      <CardHeader className="pb-4">
        <CardTitle className={`text-xl font-semibold flex items-center gap-2 ${isPremium ? 'text-white' : 'text-[#121212]'}`}>
          {getPlanIcon(subscription.plan_type)}
          Plano Atual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isPremium ? 'text-white' : 'text-gray-900'}`}>
              {getPlanDisplayName(subscription.plan_type)}
            </h3>
            <p className={`text-sm ${isPremium ? 'text-gray-200' : 'text-gray-600'}`}>
              {subscription.plan_type === 'basic' ? 'Controle essencial' : 'Controle total'}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={isPremium 
              ? 'bg-white text-[#61710C] border-white' 
              : 'bg-green-100 text-green-700 border-green-300'
            }
          >
            Ativo
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
