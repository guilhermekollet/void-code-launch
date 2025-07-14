
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { IOSSwitch } from '@/components/ui/ios-switch';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    monthlyPrice: 19.90,
    yearlyPrice: 199.90,
    features: [
      'Controle de gastos básico',
      'Relatórios mensais',
      'Até 3 cartões de crédito',
      'Suporte por email'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 29.90,
    yearlyPrice: 289.90,
    features: [
      'Controle completo de gastos',
      'Relatórios detalhados',
      'Cartões ilimitados',
      'Suporte prioritário',
      'Análises avançadas',
      'Integração com bancos'
    ]
  }
];

type RegistrationStep = 'name' | 'email' | 'phone' | 'plan';

interface FormData {
  name: string;
  email: string;
  confirmEmail: string;
  phone: string;
  selectedPlan: string;
  billingCycle: 'monthly' | 'yearly';
}

export default function Register() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('name');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    confirmEmail: '',
    phone: '55',
    selectedPlan: '',
    billingCycle: 'monthly'
  });
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [isContinuation, setIsContinuation] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const steps = ['Nome', 'Email', 'Telefone', 'Plano'];
  const stepKeys: RegistrationStep[] = ['name', 'email', 'phone', 'plan'];
  const currentStepIndex = stepKeys.indexOf(currentStep);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const validateName = (name: string): boolean => {
    const nameParts = name.trim().split(' ').filter(part => part.length > 0);
    return nameParts.length >= 2;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return phone.length >= 10;
  };

  const checkEmailExists = async (email: string): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking email:', error);
      return { exists: false, canContinue: false };
    }
  };

  const checkPhoneExists = async (phone: string): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-phone-exists', {
        body: { phoneNumber: phone }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking phone:', error);
      return { exists: false };
    }
  };

  const saveOrUpdateOnboarding = async (stage: string, updateData: Partial<FormData> = {}) => {
    try {
      const dataToSave = {
        name: updateData.name || formData.name,
        email: updateData.email || formData.email,
        phone: (updateData.phone || formData.phone).replace(/\D/g, ''),
        selected_plan: updateData.selectedPlan || formData.selectedPlan,
        billing_cycle: updateData.billingCycle || formData.billingCycle,
        registration_stage: stage
      };

      if (onboardingId) {
        const { error } = await supabase
          .from('onboarding')
          .update(dataToSave)
          .eq('id', onboardingId);

        if (error) throw error;
        console.log('Updated onboarding record:', onboardingId);
      } else {
        const { data: existingRecord } = await supabase
          .from('onboarding')
          .select('id')
          .eq('email', dataToSave.email)
          .single();

        if (existingRecord) {
          const { error } = await supabase
            .from('onboarding')
            .update(dataToSave)
            .eq('id', existingRecord.id);

          if (error) throw error;
          setOnboardingId(existingRecord.id);
          console.log('Updated existing onboarding record:', existingRecord.id);
        } else {
          const { data, error } = await supabase
            .from('onboarding')
            .insert([dataToSave])
            .select('id')
            .single();

          if (error) throw error;
          if (data) setOnboardingId(data.id);
          console.log('Created new onboarding record:', data?.id);
        }
      }

      toast({
        title: "Progresso salvo",
        description: "Seus dados foram salvos com segurança.",
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar progresso. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const loadExistingData = (existingData: any) => {
    setFormData({
      name: existingData.name || '',
      email: existingData.email || '',
      confirmEmail: existingData.email || '',
      phone: existingData.phone || '55',
      selectedPlan: existingData.selectedPlan || '',
      billingCycle: existingData.billingCycle || 'monthly'
    });

    if (existingData.onboardingId) {
      setOnboardingId(existingData.onboardingId);
    }

    const stage = existingData.registrationStage;
    if (stage === 'phone') {
      setCurrentStep('plan');
    } else if (stage === 'plan' || stage === 'payment') {
      setCurrentStep('plan');
    } else if (stage === 'email') {
      setCurrentStep('phone');
    } else {
      setCurrentStep('name');
    }

    setIsContinuation(true);
  };

  const canProceedFromStep = (step: RegistrationStep): boolean => {
    switch (step) {
      case 'name':
        return validateName(formData.name);
      case 'email':
        return validateEmail(formData.email) && 
               validateEmail(formData.confirmEmail) && 
               formData.email === formData.confirmEmail;
      case 'phone':
        return validatePhone(formData.phone);
      case 'plan':
        return formData.selectedPlan !== '';
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceedFromStep(currentStep)) {
      let errorMessage = '';
      switch (currentStep) {
        case 'name':
          errorMessage = 'Por favor, insira nome e sobrenome';
          break;
        case 'email':
          errorMessage = 'Por favor, insira emails válidos e iguais';
          break;
        case 'phone':
          errorMessage = 'Por favor, insira um telefone válido';
          break;
        case 'plan':
          errorMessage = 'Por favor, selecione um plano';
          break;
      }
      toast({
        title: "Dados incompletos",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (currentStep === 'name') {
      await saveOrUpdateOnboarding('name');
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepKeys.length) {
        setCurrentStep(stepKeys[nextIndex]);
      }
      return;
    }

    if (currentStep === 'email') {
      setCheckingEmail(true);
      const emailCheckResult = await checkEmailExists(formData.email);
      setCheckingEmail(false);

      if (emailCheckResult.exists && emailCheckResult.completed) {
        if (emailCheckResult.shouldCreateUser) {
          toast({
            title: "Cadastro concluído",
            description: "Redirecionando para o dashboard...",
          });
          return;
        }
        
        toast({
          title: "Email já cadastrado",
          description: emailCheckResult.message,
          variant: "destructive"
        });
        return;
      }

      if (emailCheckResult.canContinue && emailCheckResult.existingData) {
        toast({
          title: "Cadastro encontrado",
          description: emailCheckResult.message,
        });
        loadExistingData(emailCheckResult.existingData);
        return;
      }

      await saveOrUpdateOnboarding('email');
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepKeys.length) {
        setCurrentStep(stepKeys[nextIndex]);
      }
      return;
    }

    if (currentStep === 'phone') {
      setCheckingPhone(true);
      const phoneCheckResult = await checkPhoneExists(formData.phone);
      setCheckingPhone(false);

      if (phoneCheckResult.exists) {
        toast({
          title: "Telefone já cadastrado",
          description: phoneCheckResult.message,
          variant: "destructive"
        });
        return;
      }

      await saveOrUpdateOnboarding('phone');
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepKeys.length) {
        setCurrentStep(stepKeys[nextIndex]);
      }
      return;
    }

    if (currentStep === 'plan') {
      await saveOrUpdateOnboarding('plan');
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepKeys.length) {
      setCurrentStep(stepKeys[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepKeys[prevIndex]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanSelect = (planId: string) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
  };

  const handleFinishRegistration = async () => {
    if (!formData.selectedPlan) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um plano.",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(true);

    try {
      await saveOrUpdateOnboarding('payment');

      console.log('Creating checkout session with data:', {
        planType: formData.selectedPlan,
        billingCycle: formData.billingCycle,
        onboardingId: onboardingId
      });

      // Use create-checkout edge function instead of direct Stripe links
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          onboardingId: onboardingId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar sessão de pagamento');
      }

      if (!data.url) {
        throw new Error('URL de pagamento não recebida');
      }

      console.log('Checkout session created, redirecting to:', data.url);

      // Store registration data for recovery
      localStorage.setItem('registrationData', JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''),
        plan: formData.selectedPlan,
        billingCycle: formData.billingCycle,
        onboardingId: onboardingId,
        sessionId: data.sessionId
      }));

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDiscountPercentage = (): number => {
    return 20; // 20% de desconto para planos anuais
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50">
        <ProgressBar steps={steps} currentStep={currentStepIndex} />
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto" 
              />
            </div>
            {isContinuation && (
              <div className="text-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✨ Continuando seu cadastro
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {currentStep === 'name' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Qual é o seu nome?</h2>
                  <p className="text-sm text-[#64748B]">Insira seu nome completo</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#121212]">Nome completo *</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Nome Sobrenome" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="border-[#DEDEDE] focus:border-[#61710C]" 
                  />
                  {formData.name && !validateName(formData.name) && (
                    <p className="text-sm text-red-500">Digite nome e sobrenome</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'email' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Qual é o seu email?</h2>
                  <p className="text-sm text-[#64748B]">Insira um email válido</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#121212]">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={formData.email} 
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-[#DEDEDE] focus:border-[#61710C]" 
                    />
                    {formData.email && !validateEmail(formData.email) && (
                      <p className="text-sm text-red-500">Email inválido</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail" className="text-[#121212]">Confirmar email *</Label>
                    <Input 
                      id="confirmEmail" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={formData.confirmEmail} 
                      onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                      className="border-[#DEDEDE] focus:border-[#61710C]" 
                    />
                    {formData.confirmEmail && formData.email !== formData.confirmEmail && (
                      <p className="text-sm text-red-500">Emails não coincidem</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'phone' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Qual é o seu telefone?</h2>
                  <p className="text-sm text-[#64748B]">Insira seu número com DDD</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#121212]">Telefone *</Label>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(phone) => handleInputChange('phone', phone.replace(/\D/g, ''))}
                  />
                  {formData.phone && formData.phone.length > 2 && !validatePhone(formData.phone) && (
                    <p className="text-sm text-red-500">Telefone inválido</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'plan' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Escolha seu plano</h2>
                  <p className="text-sm text-[#64748B]">Selecione o plano ideal para você</p>
                </div>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className={`text-sm ${formData.billingCycle === 'monthly' ? 'text-[#121212] font-medium' : 'text-[#64748B]'}`}>
                    Mensal
                  </span>
                  <IOSSwitch
                    checked={formData.billingCycle === 'yearly'}
                    onCheckedChange={(checked) => handleInputChange('billingCycle', checked ? 'yearly' : 'monthly')}
                  />
                  <span className={`text-sm ${formData.billingCycle === 'yearly' ? 'text-[#121212] font-medium' : 'text-[#64748B]'}`}>
                    Anual
                  </span>
                  {formData.billingCycle === 'yearly' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      20% de desconto
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.selectedPlan === plan.id
                          ? 'border-[#61710C] bg-green-50'
                          : 'border-[#DEDEDE] hover:border-[#61710C]'
                      }`}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.selectedPlan === plan.id
                                  ? 'border-[#61710C] bg-[#61710C]'
                                  : 'border-gray-300'
                              }`}
                            >
                              {formData.selectedPlan === plan.id && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <h3 className="font-semibold text-[#121212]">{plan.name}</h3>
                          </div>
                          
                          <div className="mt-2 ml-8">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-[#121212]">
                                {formatPrice(formData.billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                              </span>
                              <span className="text-sm text-[#64748B]">
                                /{formData.billingCycle === 'monthly' ? 'mês' : 'ano'}
                              </span>
                            </div>
                            
                            {formData.billingCycle === 'yearly' && (
                              <div className="text-sm text-green-600">
                                {getDiscountPercentage()}% de desconto
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPlan(expandedPlan === plan.id ? null : plan.id);
                          }}
                          className="text-[#61710C]"
                        >
                          {expandedPlan === plan.id ? 'Ocultar' : 'Detalhes'}
                        </Button>
                      </div>
                      
                      {expandedPlan === plan.id && (
                        <div className="mt-4 ml-8 space-y-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-[#64748B]">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-1.5 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-2 w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              {currentStep !== 'plan' ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedFromStep(currentStep) || checkingEmail || checkingPhone}
                  className="bg-[#61710C] hover:bg-[#4a5709] text-white flex items-center gap-2 w-full"
                >
                  {checkingEmail ? 'Verificando email...' : checkingPhone ? 'Verificando telefone...' : 'Próximo'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinishRegistration}
                  disabled={!canProceedFromStep(currentStep) || processingPayment}
                  className="bg-[#61710C] hover:bg-[#4a5709] text-white flex items-center gap-2 w-full"
                >
                  {processingPayment ? 'Processando...' : 'Finalizar Cadastro'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </Button>
              )}
            </div>

            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551992527815', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white mb-4"
              >
                Precisa de ajuda? Fale conosco
              </Button>
            </div>

            <div className="text-center border-t border-[#DEDEDE] pt-4">
              <p className="text-sm text-[#64748B]">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-[#61710C] hover:underline font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
