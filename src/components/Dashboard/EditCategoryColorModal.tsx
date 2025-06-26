
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoryMutations } from '@/hooks/useCategoryMutations';

interface EditCategoryColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: { id: number; name: string; color: string } | null;
}

export function EditCategoryColorModal({ isOpen, onClose, category }: EditCategoryColorModalProps) {
  const [selectedColor, setSelectedColor] = useState(category?.color || '#61710C');
  const { updateCategoryColor } = useCategoryMutations();

  React.useEffect(() => {
    if (category) {
      setSelectedColor(category.color);
    }
  }, [category]);

  const handleSave = () => {
    if (category) {
      updateCategoryColor.mutate(
        { categoryId: category.id, color: selectedColor },
        {
          onSuccess: () => {
            onClose();
          }
        }
      );
    }
  };

  const presetColors = [
    '#61710C', '#84CC16', '#22C55E', '#10B981', '#059669',
    '#047857', '#065F46', '#064E3B', '#F59E0B', '#EF4444',
    '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#3B82F6',
    '#1D4ED8', '#1E40AF', '#1E3A8A', '#8B5CF6', '#7C3AED'
  ];

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cor da Categoria</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Categoria: {category.name}
            </Label>
          </div>

          <div className="space-y-3">
            <Label htmlFor="color-input" className="text-sm font-medium text-gray-700">
              Cor Personalizada
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="color-input"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-16 h-10 rounded-md border cursor-pointer"
              />
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="flex-1"
                placeholder="#61710C"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Cores Predefinidas
            </Label>
            <div className="grid grid-cols-10 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-md border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <div 
              className="w-12 h-12 rounded-md border-2 border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Prévia da cor</p>
              <p className="text-xs text-gray-500">{selectedColor}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updateCategoryColor.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateCategoryColor.isPending}
              className="bg-[#61710C] hover:bg-[#4F5A0A]"
            >
              {updateCategoryColor.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
