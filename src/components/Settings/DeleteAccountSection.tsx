
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">Zona de Perigo</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Ações irreversíveis relacionadas à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-gray-900 mb-2">Excluir Conta Permanentemente</h4>
            <p className="text-sm text-gray-600 mb-4">
              Remove permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.
              Seus dados serão arquivados para fins estatísticos, mas não estarão mais acessíveis.
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
