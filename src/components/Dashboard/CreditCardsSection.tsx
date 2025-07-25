
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardsList } from "@/components/CreditCards/CreditCardsList";
import { useCardLimits } from "@/hooks/useCardLimits";

export function CreditCardsSection() {
  const { cardLimit, currentCardCount } = useCardLimits();

  return (
    <Card className="bg-white border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-[#121212]">Cartões</CardTitle>
      </CardHeader>
      <CardContent>
        <CreditCardsList />
      </CardContent>
    </Card>
  );
}
