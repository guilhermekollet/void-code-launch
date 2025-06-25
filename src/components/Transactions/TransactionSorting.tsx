
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TransactionSortingProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function TransactionSorting({ sortBy, sortOrder, onSortChange }: TransactionSortingProps) {
  const handleSortByChange = (value: string) => {
    onSortChange(value, sortOrder);
  };

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
          <SelectItem value="tx_date">Data</SelectItem>
          <SelectItem value="amount">Valor</SelectItem>
          <SelectItem value="category">Categoria</SelectItem>
          <SelectItem value="description">Descrição</SelectItem>
        </SelectContent>
      </Select>
      
      <button
        onClick={toggleSortOrder}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
