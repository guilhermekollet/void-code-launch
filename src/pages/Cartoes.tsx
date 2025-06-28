
import { CreditCardsSection } from "@/components/Dashboard/CreditCardsSection";

export default function Cartoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#121212]">Cartões de Crédito</h1>
          <p className="text-[#64748B] mt-1">Gerencie seus cartões de crédito</p>
        </div>
      </div>

      <CreditCardsSection />
    </div>
  );
}
