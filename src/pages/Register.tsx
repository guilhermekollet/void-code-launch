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
import { DateInputMask } from '@/components/ui/date-input-mask';
import { CityInput } from '@/components/ui/city-input';

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
      'Envio de mensagens ilimitadas pelo WhatsApp',
      'Relatórios financeiros básicos',
      'Gastos recorrentes',
      'Até 1 cartão',
      'Categorias',
      'Fluxo de caixa financeiro'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 29.90,
    yearlyPrice: 289.90,
    features: [
      'Tudo do básico',
      'Educação financeira com base no seu contexto',
      'Relatórios financeiros avançados',
      'Exportação de relatórios PDF e CSV',
      'Até 5 cartões',
      'Acesso antecipado',
      'Suporte prioritário'
    ]
  }
];

type RegistrationStep = 'name' | 'email' | 'phone' | 'birthDate' | 'city' | 'plan';

interface FormData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  selectedPlan: string;
  billingCycle: string;
}

export default function Register() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('name');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '55',
    birthDate: '',
    city: '',
    selectedPlan: '',
    billingCycle: 'yearly'
  });
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [isContinuation, setIsContinuation] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const steps = ['Nome', 'Email', 'Telefone', 'Data Nascimento', 'Cidade', 'Plano'];
  const stepKeys: RegistrationStep[] = ['name', 'email', 'phone', 'birthDate', 'city', 'plan'];
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
    // Remove all non-digits for validation
    const numericPhone = phone.replace(/\D/g, '');
    
    // For Brazilian numbers (+55), check if it's valid
    if (numericPhone.startsWith('55')) {
      const phoneWithoutCountryCode = numericPhone.substring(2);
      // Brazilian mobile numbers: 11 digits total (2 country + 2 area + 9 number)
      // or 10 digits for landlines (2 country + 2 area + 8 number)
      return phoneWithoutCountryCode.length >= 10 && phoneWithoutCountryCode.length <= 11;
    }
    
    // For other countries, minimum 10 digits
    return numericPhone.length >= 10;
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
        birth_date: updateData.birthDate || formData.birthDate ? 
          (() => {
            const dateStr = updateData.birthDate || formData.birthDate;
            if (!dateStr) return null;
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          })() : null,
        city: updateData.city || formData.city,
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
      phone: existingData.phone || '55',
      birthDate: existingData.birthDate ? 
        (() => {
          const date = new Date(existingData.birthDate);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear().toString();
          return `${day}/${month}/${year}`;
        })() : '',
      city: existingData.city || '',
      selectedPlan: existingData.selectedPlan || '',
      billingCycle: existingData.billingCycle || 'yearly'
    });

    if (existingData.onboardingId) {
      setOnboardingId(existingData.onboardingId);
    }

    const stage = existingData.registrationStage;
    if (stage === 'plan' || stage === 'payment') {
      setCurrentStep('plan');
    } else if (stage === 'city') {
      setCurrentStep('plan');
    } else if (stage === 'birthDate') {
      setCurrentStep('city');
    } else if (stage === 'phone') {
      setCurrentStep('birthDate');
    } else if (stage === 'email') {
      setCurrentStep('phone');
    } else {
      setCurrentStep('name');
    }

    setIsContinuation(true);
  };

  const validateBirthDate = (dateStr: string): boolean => {
    if (!dateStr || dateStr.length !== 10) return false;
    
    const [day, month, year] = dateStr.split('/').map(Number);
    
    // Verificar se os valores são válidos
    if (!day || !month || !year || month > 12 || day > 31) return false;
    
    const date = new Date(year, month - 1, day);
    const today = new Date();
    
    // Verificar se a data é válida
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return false;
    }
    
    // Verificar idade mínima (16 anos)
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 16;
    }
    
    return age >= 16 && date <= today; // Não pode ser data futura
  };

  const validateCity = (city: string): boolean => {
    return city.trim().length >= 3;
  };

  const canProceedFromStep = (step: RegistrationStep): boolean => {
    switch (step) {
      case 'name':
        return validateName(formData.name);
      case 'email':
        return validateEmail(formData.email);
      case 'phone':
        return validatePhone(formData.phone);
      case 'birthDate':
        return validateBirthDate(formData.birthDate);
      case 'city':
        return validateCity(formData.city);
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
          errorMessage = 'Por favor, insira um email válido';
          break;
        case 'phone':
          errorMessage = 'Por favor, insira um telefone válido';
          break;
        case 'birthDate':
          errorMessage = 'Por favor, insira uma data de nascimento válida (mínimo 16 anos)';
          break;
        case 'city':
          errorMessage = 'Por favor, selecione sua cidade';
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
      //await saveOrUpdateOnboarding('name');
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

    if (currentStep === 'birthDate') {
      await saveOrUpdateOnboarding('birthDate');
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepKeys.length) {
        setCurrentStep(stepKeys[nextIndex]);
      }
      return;
    }

    if (currentStep === 'city') {
      await saveOrUpdateOnboarding('city');
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

      /*console.log('Creating checkout session with data:', {
        planType: formData.selectedPlan,
        billingCycle: formData.billingCycle,
        onboardingId: onboardingId,
        email: formData.email
      });*/

      // Use create-checkout edge function with email
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          onboardingId: onboardingId,
          email: formData.email
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

  const getDisplayPrice = (plan: Plan): { monthly: number; yearly: number } => {
    if (formData.billingCycle === 'yearly') {
      return {
        monthly: plan.yearlyPrice / 12,
        yearly: plan.yearlyPrice
      };
    }
    return {
      monthly: plan.monthlyPrice,
      yearly: plan.yearlyPrice
    };
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
                    className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-30" 
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
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#121212]">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={formData.email} 
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-30" 
                  />
                  {formData.email && !validateEmail(formData.email) && (
                    <p className="text-sm text-red-500">Email inválido</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'phone' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Qual é o seu telefone?</h2>
                  <p className="text-sm text-[#64748B]">Insira seu número com DDD (máx. 11 dígitos)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#121212]">Telefone *</Label>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(phone) => handleInputChange('phone', phone.replace(/\D/g, ''))}
                  />
                  {formData.phone && formData.phone.length > 2 && !validatePhone(formData.phone) && (
                    <p className="text-sm text-red-500">
                      {formData.phone.startsWith('55') 
                        ? 'Número brasileiro deve ter entre 10 e 11 dígitos após o DDD'
                        : 'Telefone inválido'
                      }
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'birthDate' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Qual é sua data de nascimento?</h2>
                  <p className="text-sm text-[#64748B]">Insira sua data de nascimento (mínimo 16 anos)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-[#121212]">Data de nascimento *</Label>
                  <DateInputMask
                    value={formData.birthDate}
                    onChange={(value) => handleInputChange('birthDate', value)}
                    placeholder="dd/mm/aaaa"
                    className="w-full"
                  />
                  {formData.birthDate && !validateBirthDate(formData.birthDate) && (
                    <p className="text-sm text-red-500">
                      Data inválida (mínimo 16 anos e não pode ser futura)
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'city' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Em qual cidade você mora?</h2>
                  <p className="text-sm text-[#64748B]">Digite e selecione sua cidade</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[#121212]">Cidade *</Label>
                  <CityInput
                    value={formData.city}
                    onValueChange={(city) => handleInputChange('city', city)}
                    placeholder="Digite sua cidade"
                    className="w-full"
                  />
                  {formData.city && !validateCity(formData.city) && (
                    <p className="text-sm text-red-500">
                      Selecione uma cidade válida
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'plan' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-[#121212]">Escolha seu plano</h2>
                  <p className="text-sm text-[#64748B]">Selecione o plano ideal para você</p>
                  <p className="text-sm text-green-600 mt-2">🎉 3 dias grátis para experimentar!</p>
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
                  {plans.map((plan) => {
                    const displayPrice = getDisplayPrice(plan);
                    
                    return (
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
                                  {formatPrice(displayPrice.monthly)}
                                </span>
                                <span className="text-sm text-[#64748B]">/mês</span>
                              </div>
                              
                              {formData.billingCycle === 'yearly' && (
                                <div className="text-sm text-green-600">
                                  {formatPrice(displayPrice.yearly)} cobrado anualmente
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 ml-8 space-y-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-[#64748B]">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
