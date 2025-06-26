import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddCategory } from "@/hooks/useAddCategory";
import { Tag } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (categoryName: string) => void;
}

const AVAILABLE_ICONS = [
  // Alimentação
  'utensils',
  'chef-hat',
  'wine',
  'ice-cream',
  'coffee',
  'pizza',
  
  // Transporte
  'car',
  'bus',
  'train',
  'fuel',
  'parking-circle',
  'plane',
  
  // Moradia
  'home',
  'building',
  'wrench',
  'lightbulb',
  'sofa',
  'hammer',
  
  // Saúde
  'stethoscope',
  'pill',
  'activity',
  'cross',
  'heart',
  'dumbbell',
  
  // Educação
  'graduation-cap',
  'pencil',
  'calculator',
  'book-open',
  'book',
  
  // Lazer
  'film',
  'ticket',
  'palette',
  'mountain',
  'music',
  'gamepad-2',
  'camera',
  
  // Trabalho
  'briefcase',
  'computer',
  'building-2',
  'users',
  'laptop',
  
  // Compras
  'shopping-bag',
  'shopping-cart',
  'store',
  'shirt',
  'gift',
  
  // Financeiro
  'credit-card',
  'receipt',
  'trending-up',
  'piggy-bank',
  'coins',
  'dollar-sign',
  
  // Serviços/Outros
  'scissors',
  'settings',
  'wifi',
  'phone',
  'zap',
  'tag',
];

const DEFAULT_COLOR = '#61710C';

export function CategoryModal({ open, onOpenChange, onCategoryCreated }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  
  const addCategory = useAddCategory();

  const getIconComponent = (iconName: string) => {
    // Convert kebab-case to PascalCase for Lucide icon names
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore - Dynamic icon access
    return LucideIcons[pascalCase] || Tag;
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const categoryName = name.trim();

    addCategory.mutate({
      name: categoryName,
      icon: selectedIcon,
      color: DEFAULT_COLOR,
    }, {
      onSuccess: () => {
        if (onCategoryCreated) {
          onCategoryCreated(categoryName);
        }
        setName('');
        setSelectedIcon('tag');
        onOpenChange(false);
      }
    });
  };

  const isFormValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto bg-white border-[#DEDEDE] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nova Categoria</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome da categoria */}
          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-sm font-medium">
              Nome da Categoria
            </Label>
            <Input
              id="category-name"
              placeholder="Ex: Alimentação, Transporte..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
              style={{ fontSize: '16px' }}
              autoFocus
            />
          </div>

          {/* Seleção de ícone */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ícone</Label>
            <div className="grid grid-cols-8 gap-3 max-h-60 overflow-y-auto p-4 border border-[#DEDEDE] rounded-lg bg-gray-50">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center ${
                      selectedIcon === iconName
                        ? 'border-[#61710C] bg-white shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    title={iconName.replace('-', ' ')}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: DEFAULT_COLOR }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="flex items-center gap-3 p-4 bg-white border-2 border-dashed border-gray-200 rounded-lg">
              {React.createElement(
                getIconComponent(selectedIcon),
                { 
                  className: "w-6 h-6",
                  style: { color: DEFAULT_COLOR }
                }
              )}
              <span className="font-medium text-gray-900">
                {name || 'Nome da categoria'}
              </span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10"
            disabled={addCategory.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || addCategory.isPending}
            className="flex-1 h-10"
            style={{ backgroundColor: '#61710C', color: '#CFF500' }}
          >
            {addCategory.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
