
import { useCreditCards } from "@/hooks/useCreditCards";
import { CreditCardItem } from "./CreditCardItem";
import { AddCreditCardButton } from "./AddCreditCardButton";
import { Skeleton } from "@/components/ui/skeleton";

export function CreditCardsList() {
  const { data: creditCards = [], isLoading } = useCreditCards();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[240px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AddCreditCardButton />
      {creditCards.map((card) => (
        <CreditCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
