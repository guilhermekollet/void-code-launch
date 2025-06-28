interface InstallmentSimulatorProps {
  amount: number;
  installments: number;
}
export function InstallmentSimulator({
  amount,
  installments
}: InstallmentSimulatorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const installmentValue = amount / installments;
  if (!amount || amount <= 0) {
    return null;
  }
  return <div className="p-3 rounded-lg border border-[#DEDEDE] bg-white">
      <h4 className="text-sm font-medium text-[#121212] mb-2">Simulação de Parcelas</h4>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {Array.from({
        length: Math.min(installments + 2, 6)
      }, (_, i) => {
        const currentInstallments = i + 1;
        const currentValue = amount / currentInstallments;
        const isSelected = currentInstallments === installments;
        return <div key={currentInstallments} className={`flex justify-between text-sm ${isSelected ? 'font-semibold text-[#61710C]' : 'text-[#64748B]'}`}>
              <span>{currentInstallments}x</span>
              <span>{formatCurrency(currentValue)}</span>
            </div>;
      })}
        {installments > 4 && <div className="border-t pt-1 mt-1">
            <div className="flex justify-between text-sm font-semibold text-[#61710C]">
              <span>{installments}x (selecionado)</span>
              <span>{formatCurrency(installmentValue)}</span>
            </div>
          </div>}
      </div>
    </div>;
}