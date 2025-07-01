import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeClosed } from 'lucide-react';
export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone_number: formData.phone
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message === 'User already registered' ? 'Este email já está cadastrado' : error.message,
          variant: "destructive"
        });
        return;
      }
      if (data.user) {
        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso. Fazendo login..."
        });
        navigate('/', {
          replace: true
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE] px-4">
      <Card className="w-full max-w-md border-[#DEDEDE]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" alt="Bolsofy Logo" className="h-12 w-auto" />
          </div>
          
          <CardDescription className="text-[#64748B]">
            Crie sua conta para começar a gerenciar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#121212]">Nome completo</Label>
              <Input id="name" name="name" type="text" placeholder="Seu nome completo" value={formData.name} onChange={handleChange} required className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#121212]">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={handleChange} required className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#121212]">Telefone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" value={formData.phone} onChange={handleChange} required className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#121212]">Senha</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} required className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#121212] transition-colors">
                  {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#121212]">Confirmar senha</Label>
              <div className="relative">
                <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required className="border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#121212] transition-colors">
                  {showConfirmPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-[#61710C] hover:underline font-medium">
                Faça login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
}