// components/PaymentStatusCard.tsx
import React from 'react';
import { Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaymentStatusCardProps {
  status: 'loading' | 'success' | 'error';
  message?: string;
  userCreated?: boolean;
  onContactSupport: () => void;
  onGoToDashboard: () => void;
  onBackToLogin: () => void;
}

const LOGO_SRC = "/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png";

export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  status,
  message,
  userCreated,
  onContactSupport,
  onGoToDashboard,
  onBackToLogin
}) => {
  const LogoImage = () => (
    <div className="mx-auto mb-4">
      <img 
        src={LOGO_SRC}
        alt="Bolsofy Logo" 
        className="h-12 w-auto mx-auto" 
      />
    </div>
  );

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <LogoImage />
          <div className="mx-auto mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <CardTitle>Processando Pagamento</CardTitle>
          <CardDescription>
            Aguarde enquanto confirmamos seu pagamento e criamos sua conta...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <LogoImage />
          <CardTitle className="text-2xl text-green-700 mb-2">
            Bem-vindo ao Bolsofy! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Sua conta foi criada com sucesso! Você tem 3 dias grátis para explorar todos os recursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <p className="font-medium">🎁 Período de teste ativo!</p>
            <p>Aproveite 3 dias grátis para conhecer todos os recursos do Bolsofy.</p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button
              onClick={onGoToDashboard}
              className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
              aria-label="Ir para o dashboard principal"
            >
              Entrar no Dashboard
            </Button>
            
            <Button
              onClick={onContactSupport}
              variant="outline"
              className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
              aria-label="Entrar em contato com suporte via WhatsApp"
            >
              Falar com Agente no WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <LogoImage />
        <div className="mx-auto mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-red-700">Erro no Processamento</CardTitle>
        <CardDescription>
          Ocorreu um erro ao processar seu pagamento ou criar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {message}
          </div>
        )}
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Precisa de ajuda?</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>suporte@bolsofy.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>WhatsApp: (51) 99591-5520</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Button 
            onClick={onContactSupport}
            className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
            aria-label="Contatar suporte via WhatsApp"
          >
            Falar com Agente no WhatsApp
          </Button>
          
          <Button 
            onClick={onBackToLogin}
            variant="outline"
            className="w-full"
            aria-label="Voltar para a página de login"
          >
            Voltar ao Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};