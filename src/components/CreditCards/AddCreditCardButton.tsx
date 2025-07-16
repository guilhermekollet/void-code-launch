
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Crown } from "lucide-react";
import { useState } from "react";
import { AddCreditCardModal } from "./AddCreditCardModal";
import { useCardLimits } from "@/hooks/useCardLimits";
import { useNavigate } from "react-router-dom";

export function AddCreditCardButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canAddCard, isLimitReached } = useCardLimits();
  const navigate = useNavigate();

  const handleClick = () => {
    if (canAddCard) {
      setIsModalOpen(true);
    } else {
      navigate('/configuracoes');
    }
  };

  return (
    <>
      <Card className="border-2 border-dashed border-[#E2E8F0] hover:border-[#61710C] transition-colors bg-transparent">
        <CardContent className="flex items-center justify-center h-[240px] p-6">
          {canAddCard ? (
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-3 h-auto p-6 hover:bg-[#F8F9FA]"
              onClick={handleClick}
            >
              <div className="w-12 h-12 rounded-full border-2 border-[#61710C] flex items-center justify-center">
                <Plus className="h-6 w-6 text-[#61710C]" />
              </div>
              <span className="text-[#61710C] font-medium">Adicionar Cartão</span>
            </Button>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center mx-auto mb-3">
                <Crown className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-2">Limite de cartões atingido</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClick}
                className="text-[#61710C] border-[#61710C] hover:bg-[#61710C] hover:text-white"
              >
                Fazer Upgrade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canAddCard && (
        <AddCreditCardModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}
