
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditCardDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CreditCardDropdown({ value, onChange, className }: CreditCardDropdownProps) {
  const { data: creditCards = [], isLoading } = useCreditCards();

  if (isLoading) {
    return <Skeleton className={`h-10 ${className}`} />;
  }

  if (creditCards.length === 0) {
    return (
      <div className={`h-10 px-3 py-2 border border-[#DEDEDE] rounded-md bg-gray-50 flex items-center text-sm text-gray-500 ${className}`}>
        Nenhum cartão cadastrado
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-10 ${className}`}>
        <SelectValue placeholder="Selecione um cartão" />
      </SelectTrigger>
      <SelectContent>
        {creditCards.map((card) => {
          const cardName = card.card_name || card.bank_name;
          return (
            <SelectItem key={card.id} value={card.id.toString()}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: card.color }}
                />
                {cardName} - {card.bank_name}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
