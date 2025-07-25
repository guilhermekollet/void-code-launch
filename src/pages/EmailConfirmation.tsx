
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle } from 'lucide-react';

export default function EmailConfirmation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE] px-4">
      <Card className="w-full max-w-md border-[#DEDEDE]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" 
              alt="Bolsofy Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <div className="flex justify-center mb-4">
            <div className="bg-[#61710C] rounded-full p-3">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-[#121212] text-xl">Confirme seu email</CardTitle>
          <CardDescription className="text-[#64748B]">
            Enviamos um link de confirmação para seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-[#F59E0B] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[#92400E] font-medium">
                  Não esqueça de verificar sua caixa de spam!
                </p>
                <p className="text-xs text-[#92400E] mt-1">
                  Às vezes nossos emails podem parar na pasta de spam ou lixo eletrônico.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <p className="text-sm text-[#64748B]">
              Clique no link do email para ativar sua conta e começar a usar o Bolsofy.
            </p>
            
            <div className="pt-4">
              <Link to="/login">
                <Button 
                  variant="outline" 
                  className="w-full border-[#DEDEDE] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                >
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
