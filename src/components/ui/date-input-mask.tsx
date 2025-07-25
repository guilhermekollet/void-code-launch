import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DateInputMaskProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DateInputMask = forwardRef<HTMLInputElement, DateInputMaskProps>(
  ({ value = '', onChange, placeholder = 'dd/mm/aaaa', className, ...props }, ref) => {
    const formatDate = (input: string): string => {
      // Remove todos os caracteres não numéricos
      const numericOnly = input.replace(/\D/g, '');
      
      // Aplicar máscara dd/mm/yyyy
      let formatted = numericOnly;
      
      if (formatted.length >= 2) {
        formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
      }
      
      if (formatted.length >= 5) {
        formatted = formatted.substring(0, 5) + '/' + formatted.substring(5);
      }
      
      // Limitar a 10 caracteres (dd/mm/yyyy)
      if (formatted.length > 10) {
        formatted = formatted.substring(0, 10);
      }
      
      return formatted;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatDate(e.target.value);
      onChange?.(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir teclas de controle
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        (e.key === 'a' && e.ctrlKey === true) ||
        (e.key === 'c' && e.ctrlKey === true) ||
        (e.key === 'v' && e.ctrlKey === true) ||
        (e.key === 'x' && e.ctrlKey === true)
      ) {
        return;
      }
      
      // Bloquear caracteres não numéricos
      if (!/\d/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(className)}
        maxLength={10}
        {...props}
      />
    );
  }
);

DateInputMask.displayName = 'DateInputMask';