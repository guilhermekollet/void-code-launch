
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddCreditCardModal } from "./AddCreditCardModal";

export function AddCreditCardButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="border-2 border-dashed border-[#E2E8F0] hover:border-[#61710C] transition-colors bg-transparent">
        <CardContent className="flex items-center justify-center h-[240px] p-6">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-3 h-auto p-6 hover:bg-[#F8F9FA]"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#61710C] flex items-center justify-center">
              <Plus className="h-6 w-6 text-[#61710C]" />
            </div>
            <span className="text-[#61710C] font-medium">Adicionar Cartão</span>
          </Button>
        </CardContent>
      </Card>

      <AddCreditCardModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
