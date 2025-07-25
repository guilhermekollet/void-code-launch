import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'phone' | 'email-sent';

export default function Login() {
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('55');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const formatPhoneForDisplay = (phone: string) => {
    if (phone.startsWith('55') && phone.length >= 12) {
      const number = phone.substring(2);
      if (number.length === 11) {
        return `+55 (${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
      }
      return `+55 ${number}`;
    }
    return `+${phone}`;
  };

  const handleSendMagicLink = async (isResend = false) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número de telefone válido.",
        variant: "destructive"
      });
      return;
    }

    if (isResend) {
      setIsResending(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await supabase.functions.invoke('send-magic-link', {
        body: { phoneNumber }
      });

      // Verificar se houve erro na resposta
      if (response.error) {
        throw response.error;
      }

      const data = response.data;

      // Se há erro específico na resposta da função
      if (data?.error) {
        // Verificar se é erro de conta não encontrada
        if (data.error === "Conta não encontrada") {
          toast({
            title: "Conta não encontrada",
            description: "Não encontramos uma conta associada a este número. Cadastre-se primeiro para acessar o Bolsofy.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no envio",
            description: data.message || "Não foi possível enviar o link. Tente novamente.",
            variant: "destructive"
          });
        }
        return;
      }

      // Se chegou até aqui, o link foi enviado com sucesso
      if (data?.maskedEmail) {
        setMaskedEmail(data.maskedEmail);
        
        if (isResend) {
          toast({
            title: "Link reenviado com sucesso!",
            description: `Novo link de acesso enviado para ${data.maskedEmail}. Verifique sua caixa de entrada.`,
          });
        } else {
          toast({
            title: "Link enviado com sucesso!",
            description: `Link de acesso enviado para ${data.maskedEmail}. Verifique sua caixa de entrada.`,
          });
          setAuthStep('email-sent');
        }
      }
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      
      const errorMessage = isResend ? 
        "Não foi possível reenviar o link. Tente novamente." :
        "Não foi possível enviar o link. Tente novamente.";
      
      toast({
        title: "Erro no envio",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsResending(false);
    }
  };

  const handleBackToPhone = () => {
    setAuthStep('phone');
    setMaskedEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center py-[60px]">
          <div className="flex justify-center mb-4">
            <img 
              src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" 
              alt="Bolsofy Logo" 
              className="h-12 w-auto" 
            />
          </div>
          
          <p className="text-[#64748B]">
            {authStep === 'phone' && 'Digite seu número de celular para acessar'}
            {authStep === 'email-sent' && 'Verifique seu email'}
          </p>
        </div>
        
        <div>
          {authStep === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#121212]">Número do celular</Label>
                <PhoneInput
                  id="phone"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  required
                />
              </div>
              
              <Button 
                onClick={() => handleSendMagicLink(false)}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
              </Button>
            </div>
          )}

          {authStep === 'email-sent' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToPhone}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#64748B]">Alterar número</span>
              </div>

              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Mail className="h-16 w-16 text-[#61710C]" />
                </div>
                <h3 className="text-lg font-semibold text-[#121212] mb-2">
                  Link enviado!
                </h3>
                <p className="text-sm text-[#64748B] mb-2">
                  Enviamos um link de acesso para:
                </p>
                <p className="font-medium text-[#121212] mb-4">
                  {maskedEmail}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Como acessar:</strong><br />
                    1. Abra seu email<br />
                    2. Procure por "Link de acesso - Bolsofy"<br />
                    3. Clique no botão no email<br />
                    4. Você será redirecionado automaticamente
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => handleSendMagicLink(true)}
                variant="outline"
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                disabled={isResending}
              >
                {isResending ? 'Reenviando...' : 'Reenviar Link'}
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-[#64748B]">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-[#61710C] hover:underline font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551992527815', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
              >
                Suporte via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
