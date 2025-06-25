
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useCategories } from "@/hooks/useCategories";
import { X } from "lucide-react";

interface TransactionFiltersProps {
  filters: {
    type: string;
    category: string;
    search: string;
    startDate?: Date;
    endDate?: Date;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function TransactionFilters({ filters, onFiltersChange, onClearFilters }: TransactionFiltersProps) {
  const { data: categories = [] } = useCategories();

  const hasActiveFilters = filters.type || filters.category || filters.search || filters.startDate || filters.endDate;

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Buscar</label>
          <Input
            placeholder="Buscar por descrição..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <Select value={filters.type} onValueChange={(value) => onFiltersChange({ ...filters, type: value })}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
              <SelectItem value="parcelado">Parcelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Categoria</label>
          <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value })}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Data inicial</label>
          <DatePicker
            date={filters.startDate}
            onDateChange={(date) => onFiltersChange({ ...filters, startDate: date })}
            placeholder="Selecionar data inicial"
            className="h-10 w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Data final</label>
          <DatePicker
            date={filters.endDate}
            onDateChange={(date) => onFiltersChange({ ...filters, endDate: date })}
            placeholder="Selecionar data final"
            className="h-10 w-full"
          />
        </div>
      </div>
    </div>
  );
}
