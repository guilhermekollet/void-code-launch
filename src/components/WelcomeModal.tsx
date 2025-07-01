
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const handleContactIA = () => {
    window.open('https://wa.me/5551995915520', '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-[#DEDEDE] max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
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
                <MessageCircle className="h-4 w-4 text-white" />
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
              className="flex-1 bg-[#61710C] hover:bg-[#4a5709] text-[#CFF500]"
            >
              <MessageCircle className="h-4 w-4 mr-2 text-[#CFF500]" />
              Falar com Bolsofy IA
            </Button>
            <Button
              onClick={onClose}
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
