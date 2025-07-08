
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
  onCategoryAdded?: (categoryName: string) => void;
  transactionType?: "despesa" | "receita";
}

export function CategoryDropdown({ value, onChange, onCategoryAdded, transactionType = "despesa" }: CategoryDropdownProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: categories = [], isLoading } = useCategories();

  // Filter categories by transaction type
  const filteredCategories = categories.filter(category => category.type === transactionType);

  const getIconComponent = (iconName: string) => {
    console.log('Trying to get icon for:', iconName);
    
    // Converter kebab-case para PascalCase para ícones do Lucide
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    console.log('Converted to PascalCase:', pascalCase);
    
    // @ts-ignore - Acesso dinâmico aos ícones
    const IconComponent = LucideIcons[pascalCase];
    
    if (IconComponent) {
      console.log('Found icon component:', pascalCase);
      return IconComponent;
    }
    
    console.log('Icon not found, using fallback Tag icon');
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
                  : filteredCategories.length === 0 
                    ? "Nenhuma categoria encontrada" 
                    : "Selecione uma categoria"
              } 
            />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
            {!isLoading && filteredCategories.length > 0 && filteredCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              console.log('Rendering category:', category.name, 'with color:', category.color);
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
        onCategoryCreated={handleCategoryCreated}
        categoryType={transactionType}
      />
    </>
  );
}
