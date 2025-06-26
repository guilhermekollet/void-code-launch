
import * as React from "react"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value
      
      // Remove tudo que não for número ou vírgula/ponto
      inputValue = inputValue.replace(/[^\d.,]/g, '')
      
      // Substitui vírgula por ponto para facilitar cálculos
      inputValue = inputValue.replace(',', '.')
      
      // Limita a 2 casas decimais
      const parts = inputValue.split('.')
      if (parts.length > 2) {
        inputValue = parts[0] + '.' + parts[1]
      }
      if (parts[1] && parts[1].length > 2) {
        inputValue = parts[0] + '.' + parts[1].substring(0, 2)
      }
      
      onChange?.(inputValue)
    }

    const displayValue = value ? `R$ ${value.replace('.', ',')}` : ''

    return (
      <input
        type="text"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-base md:text-sm",
          className
        )}
        style={{ fontSize: '16px' }}
        value={displayValue}
        onChange={handleChange}
        placeholder="R$ 0,00"
        ref={ref}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
