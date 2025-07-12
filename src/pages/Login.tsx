
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'phone' | 'email-sent';

export default function Login() {
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('55');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleSendMagicLink = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número de telefone válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: { phoneNumber }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Conta não encontrada",
          description: "Não foi encontrada uma conta com este número. Cadastre-se primeiro.",
          variant: "destructive"
        });
        return;
      }

      if (data?.maskedEmail) {
        setMaskedEmail(data.maskedEmail);
        toast({
          title: data.message || "Link enviado",
          description: `Link de acesso enviado para ${data.maskedEmail}.`
        });
        
        setAuthStep('email-sent');
      }
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar o link. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setAuthStep('phone');
    setMaskedEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md border-[#DEDEDE] bg-white">
        <CardHeader className="text-center py-[60px]">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
              alt="Bolsofy Logo" 
              className="h-12 w-auto" 
            />
          </div>
          
          <CardDescription className="text-[#64748B]">
            {authStep === 'phone' && 'Digite seu número de celular para acessar'}
            {authStep === 'email-sent' && 'Verifique seu email'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
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
                onClick={handleSendMagicLink}
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
                onClick={handleSendMagicLink}
                variant="outline"
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Reenviar Link'}
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
                <MessageCircle className="w-4 h-4 mr-2" />
                Suporte via WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
