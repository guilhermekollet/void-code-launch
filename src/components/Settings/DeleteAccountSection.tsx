
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
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-600 text-lg">Excluir Conta</CardTitle>
          <CardDescription className="text-gray-500">
            Remove permanentemente sua conta e dados associados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Seus dados serão arquivados para fins estatísticos, mas não estarão mais acessíveis.
              Você perderá acesso a todas as suas transações, cartões e configurações.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
              disabled={deleteAccount.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteAccount.isPending ? 'Processando...' : 'Excluir Conta Permanentemente'}
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
