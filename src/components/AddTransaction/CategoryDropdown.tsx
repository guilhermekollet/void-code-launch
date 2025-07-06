
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import { CategoryModal } from "./CategoryModal";
import { useCategories } from "@/hooks/useCategories";
import * as LucideIcons from "lucide-react";

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  transactionType: 'receita' | 'despesa';
  onCategoryAdded?: (categoryName: string) => void;
}

export function CategoryDropdown({ value, onChange, transactionType, onCategoryAdded }: CategoryDropdownProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: categories = [], isLoading } = useCategories(transactionType);

  const getIconComponent = (iconName: string) => {
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore
    const IconComponent = LucideIcons[pascalCase];
    
    if (IconComponent) {
      return IconComponent;
    }
    
    return Tag;
  };

  const handleCategoryCreated = (categoryName: string) => {
    if (onCategoryAdded) {
      onCategoryAdded(categoryName);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1 h-10">
            <SelectValue 
              placeholder={
                isLoading 
                  ? "Carregando..." 
                  : categories.length === 0 
                    ? `Nenhuma categoria de ${transactionType} encontrada` 
                    : `Selecione uma categoria de ${transactionType}`
              } 
            />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
            {!isLoading && categories.length > 0 && categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <SelectItem key={category.id} value={category.name}>
                  <div className="flex items-center gap-2">
                    <IconComponent 
                      className="w-4 h-4" 
                      style={{ color: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        type={transactionType}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}
