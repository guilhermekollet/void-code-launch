
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";

export function DeleteAccountSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteAccount = useDeleteAccount();

  const handleDeleteAccount = () => {
    deleteAccount.mutate();
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Excluir Conta Permanentemente</CardTitle>
          <CardDescription className="text-red-700">
            Remove permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-4">
              Seus dados serão arquivados para fins estatísticos, mas não estarão mais acessíveis.
              Você perderá acesso a todas as suas transações, cartões e configurações.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteAccount.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteAccount.isPending ? 'Processando...' : 'Excluir Minha Conta'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleDeleteAccount}
        isLoading={deleteAccount.isPending}
      />
    </>
  );
}
