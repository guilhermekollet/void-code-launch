
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteAccountModal({ open, onOpenChange, onConfirm, isLoading }: DeleteAccountModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Excluir Conta Permanentemente
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-left mt-4 space-y-3">
            <p>
              <strong>Esta ação é irreversível!</strong> Ao confirmar, você:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Perderá acesso permanente à sua conta</li>
              <li>Todos os seus dados financeiros serão removidos</li>
              <li>Suas transações, cartões e categorias serão excluídos</li>
              <li>Não será possível recuperar essas informações</li>
            </ul>
            <p className="text-sm text-gray-500 mt-4">
              Seus dados serão arquivados para fins estatísticos, mas não estarão mais acessíveis.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
