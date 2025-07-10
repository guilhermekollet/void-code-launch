
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { ConfettiRain } from '@/components/ConfettiRain';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Erro",
          description: "ID da sessão não encontrado.",
          variant: "destructive"
        });
        navigate('/register');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          setPaymentVerified(true);
          toast({
            title: "Pagamento confirmado!",
            description: "Sua conta foi criada com sucesso.",
          });
        } else {
          toast({
            title: "Erro na verificação",
            description: "Não foi possível verificar o pagamento.",
            variant: "destructive"
          });
          navigate('/register');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar pagamento.",
          variant: "destructive"
        });
        navigate('/register');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#61710C] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61710C] mx-auto mb-4"></div>
              <p className="text-[#64748B]">Verificando pagamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentVerified) {
    return null; // Will redirect to register page
  }

  return (
    <div className="min-h-screen bg-[#61710C] relative">
      <ConfettiRain />
      
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <Card className="w-full max-w-lg border-[#DEDEDE] bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto" 
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-[#121212]">
                🎉 Bem-vindo ao Bolsofy!
              </h1>
              
              <p className="text-lg text-[#64748B]">
                Sua assinatura foi confirmada com sucesso! Agora você pode começar a controlar suas finanças de forma inteligente.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ Pagamento processado<br/>
                  ✅ Conta criada<br/>
                  ✅ Acesso liberado
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white text-lg py-3"
                size="lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Acessar Dashboard
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551992527815', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com nosso agente
              </Button>
            </div>

            <div className="pt-4 border-t border-[#DEDEDE]">
              <p className="text-xs text-[#64748B]">
                Dúvidas? Nossa equipe está pronta para te ajudar via WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
