
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedPlan: 'basic',
    billingCycle: 'monthly'
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos.",
          variant: "destructive"
        });
        return;
      }

      // Verificar se email já existe
      try {
        const { data: emailExists } = await supabase.functions.invoke('check-email-exists', {
          body: { email: formData.email }
        });
        
        if (emailExists?.exists) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está em uso. Faça login ou use outro email.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar email:', error);
      }

      // Verificar se telefone já existe
      try {
        const { data: phoneExists } = await supabase.functions.invoke('check-phone-exists', {
          body: { phone: formData.phone }
        });
        
        if (phoneExists?.exists) {
          toast({
            title: "Telefone já cadastrado",
            description: "Este telefone já está em uso. Faça login ou use outro telefone.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar telefone:', error);
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      await handleSubscribe();
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // Criar ou atualizar registro de onboarding
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          selected_plan: formData.selectedPlan,
          billing_cycle: formData.billingCycle,
          registration_stage: 'payment'
        })
        .select()
        .single();

      if (onboardingError) {
        throw new Error('Erro ao criar registro de onboarding');
      }

      // Criar sessão do Stripe usando o edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          onboardingId: onboardingData.id
        }
      });

      if (checkoutError) {
        throw new Error('Erro ao criar sessão de pagamento');
      }

      // Salvar dados no localStorage para fallback
      localStorage.setItem('registrationData', JSON.stringify({
        ...formData,
        onboardingId: onboardingData.id
      }));

      // Redirecionar para o Stripe
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error('URL de pagamento não encontrada');
      }

    } catch (error) {
      console.error('Erro no processo de assinatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      monthlyPrice: 19.90,
      yearlyPrice: 199.90,
      features: [
        'Controle de gastos pessoais',
        'Categorização automática',
        'Relatórios básicos',
        'Suporte por email'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 29.90,
      yearlyPrice: 289.90,
      features: [
        'Todos os recursos do Básico',
        'Relatórios avançados',
        'Integração com bancos',
        'Análise preditiva',
        'Suporte prioritário',
        'Exportação de dados'
      ],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Login
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Crie sua conta
            </h1>
            <p className="text-xl text-gray-600">
              Comece sua jornada financeira conosco
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-[#61710C] text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`h-1 w-20 ${currentStep >= 2 ? 'bg-[#61710C]' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-[#61710C] text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Dados Pessoais</span>
            <span>Plano</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Digite seu telefone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <Button 
                onClick={handleNextStep}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
                size="lg"
              >
                Próximo
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <span className={formData.billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}>
                    Mensal
                  </span>
                  <button
                    onClick={() => handleInputChange('billingCycle', formData.billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      formData.billingCycle === 'yearly' ? 'bg-[#61710C]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        formData.billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={formData.billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}>
                    Anual
                  </span>
                </div>
              </div>

              <div className="grid gap-6">
                {plans.map((plan) => {
                  const price = formData.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                  const isSelected = formData.selectedPlan === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative p-6 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#61710C] bg-[#61710C]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('selectedPlan', plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#61710C] text-white px-3 py-1 rounded-full text-xs font-medium">
                          Mais Popular
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold">
                              R$ {price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-gray-500 ml-1">
                              /{formData.billingCycle === 'yearly' ? 'ano' : 'mês'}
                            </span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected ? 'border-[#61710C] bg-[#61710C]' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <span className="w-2 h-2 bg-[#61710C] rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="flex-1 bg-[#61710C] hover:bg-[#4a5709] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Assinar Agora'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
