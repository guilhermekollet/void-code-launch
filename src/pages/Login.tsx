import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      navigate('/', {
        replace: true
      });
    }
  }, [user, navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
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
        navigate('/', {
          replace: true
        });
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
  return <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE] px-4">
      <Card className="w-full max-w-md border-[#DEDEDE]">
        <CardHeader className="text-center py-[60px]">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/c8d5d691-6584-41b6-86ad-82dbbd10c1c5.png" alt="Bolsofy Logo" className="h-12 w-auto" />
          </div>
          
          <CardDescription className="text-[#64748B]">
            Entre na sua conta para acessar o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#121212]">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="border-[#DEDEDE] focus:border-[#61710C]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#121212]">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="border-[#DEDEDE] focus:border-[#61710C]" />
            </div>
            <Button type="submit" className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
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
    </div>;
}