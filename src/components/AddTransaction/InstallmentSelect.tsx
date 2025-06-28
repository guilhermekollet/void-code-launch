
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InstallmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  amount: number;
}

export function InstallmentSelect({ value, onChange, amount }: InstallmentSelectProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => {
          const installmentValue = amount / num;
          return (
            <SelectItem key={num} value={num.toString()}>
              <div className="flex justify-between items-center w-full min-w-[200px]">
                <span>{num}x</span>
                <span className="text-[#64748B] ml-4">
                  {amount > 0 ? formatCurrency(installmentValue) : ''}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
