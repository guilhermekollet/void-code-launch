
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcomeModal', 'true');
  };

  const handleContactIA = () => {
    window.open('https://wa.me/5551995915520', '_blank');
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-[#DEDEDE] max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img 
              src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" 
              alt="Bolsofy Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <DialogTitle className="text-center text-[#121212] text-xl">
            Bem-vindo ao Bolsofy! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-[#64748B] mt-2">
            Para facilitar seu controle financeiro, fixe no seu WhatsApp nosso agente de IA
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="bg-[#F8F9FA] rounded-lg p-4 border border-[#E2E8F0]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-[#61710C] rounded-full p-2">
                <MessageCircle className="h-4 w-4 text-[#CFF500]" />
              </div>
              <h3 className="font-semibold text-[#121212]">Bolsofy IA</h3>
            </div>
            <p className="text-sm text-[#64748B]">
              Nosso assistente inteligente permite registrar despesas e receitas através de mensagens, áudios e fotos. Experimente!
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleContactIA}
              className="flex-1 bg-[#61710C] hover:bg-[#4a5709] text-[#CFF500] justify-center"
            >
              Falar com Bolsofy IA
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-[#DEDEDE] text-[#64748B] hover:bg-gray-50"
            >
              Pular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
