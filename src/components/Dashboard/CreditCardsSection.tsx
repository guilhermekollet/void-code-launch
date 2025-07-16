
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardsList } from "@/components/CreditCards/CreditCardsList";
import { useCardLimits } from "@/hooks/useCardLimits";

export function CreditCardsSection() {
  const { cardLimit, currentCardCount } = useCardLimits();

  return (
    <Card className="bg-white border-[#E2E8F0]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#121212] text-2xl font-semibold">Cartões</CardTitle>
          <span className="text-sm text-gray-500">
            {currentCardCount} de {cardLimit} cartões utilizados
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <CreditCardsList />
      </CardContent>
    </Card>
  );
}
