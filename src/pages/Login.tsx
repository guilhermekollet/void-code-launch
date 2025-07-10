
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeClosed, ArrowLeft, Clock } from 'lucide-react';

type AuthStep = 'method' | 'phone' | 'code' | 'email';

export default function Login() {
  const [authStep, setAuthStep] = useState<AuthStep>('method');
  const [phoneNumber, setPhoneNumber] = useState('55');
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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

  const handleSendCode = async () => {
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
      const { data, error } = await supabase.functions.invoke('send-phone-code', {
        body: { phoneNumber }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erro no envio",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Código enviado",
        description: `Código de verificação enviado para o email cadastrado.`
      });
      
      setAuthStep('code');
      setCountdown(300); // 5 minutes
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 4) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 4 dígitos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-phone-code', {
        body: { 
          phoneNumber,
          code: verificationCode
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Código inválido",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      if (data?.redirect_url) {
        // Use the magic link to authenticate
        window.location.href = data.redirect_url;
      } else {
        toast({
          title: "Login realizado",
          description: "Você foi autenticado com sucesso!"
        });
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o código. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    handleSendCode();
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
            {authStep === 'method' && 'Escolha como deseja entrar na sua conta'}
            {authStep === 'phone' && 'Digite seu número de celular'}
            {authStep === 'code' && 'Digite o código de verificação'}
            {authStep === 'email' && 'Entre com email e senha'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {authStep === 'method' && (
            <div className="space-y-4">
              <Button 
                onClick={() => setAuthStep('phone')}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
              >
                Entrar com Celular
              </Button>
              <Button 
                onClick={() => setAuthStep('email')}
                variant="outline"
                className="w-full border-[#DEDEDE] hover:bg-gray-50"
              >
                Entrar com Email
              </Button>
            </div>
          )}

          {authStep === 'phone' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthStep('method')}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#64748B]">Voltar</span>
              </div>
              
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
                onClick={handleSendCode}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Código'}
              </Button>
            </div>
          )}

          {authStep === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthStep('phone')}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#64748B]">Alterar número</span>
              </div>

              <div className="text-center mb-4">
                <p className="text-sm text-[#64748B]">
                  Código enviado para o email cadastrado no número:
                </p>
                <p className="font-medium text-[#121212]">
                  {formatPhoneForDisplay(phoneNumber)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[#121212]">Código de verificação</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <Button 
                onClick={handleVerifyCode}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
                disabled={loading || verificationCode.length !== 4}
              >
                {loading ? 'Verificando...' : 'Confirmar'}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#64748B]">
                    <Clock className="h-4 w-4" />
                    <span>Reenviar em {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    className="text-[#61710C] hover:underline"
                    disabled={loading}
                  >
                    Reenviar código
                  </Button>
                )}
              </div>
            </div>
          )}

          {authStep === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthStep('method')}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#64748B]">Voltar</span>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#121212]">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#121212]">Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50 pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#121212] transition-colors"
                    >
                      {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white" 
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-[#61710C] hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
