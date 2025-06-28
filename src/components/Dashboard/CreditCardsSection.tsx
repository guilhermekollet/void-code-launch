
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardsList } from "@/components/CreditCards/CreditCardsList";

export function CreditCardsSection() {
  return (
    <Card className="bg-white border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[#121212] text-2xl font-semibold">Cartões</CardTitle>
      </CardHeader>
      <CardContent>
        <CreditCardsList />
      </CardContent>
    </Card>
  );
}
