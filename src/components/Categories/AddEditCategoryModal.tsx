
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoryMutations } from "@/hooks/useCategoryMutations";
import * as LucideIcons from "lucide-react";

interface AddEditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any;
  type: 'receita' | 'despesa';
}

const AVAILABLE_ICONS = [
  'utensils', 'chef-hat', 'wine', 'coffee', 'car', 'bus', 'fuel', 'home', 
  'building', 'lightbulb', 'stethoscope', 'pill', 'graduation-cap', 'book',
  'film', 'music', 'briefcase', 'shopping-bag', 'credit-card', 'coins',
  'tag', 'heart', 'star', 'gift', 'phone', 'laptop'
];

const COLORS = [
  '#61710C', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
  '#059669', '#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#9333ea',
  '#c026d3', '#db2777', '#e11d48'
];

export function AddEditCategoryModal({ open, onOpenChange, category, type }: AddEditCategoryModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [selectedColor, setSelectedColor] = useState('#61710C');
  
  const { addCategory, updateCategory } = useCategoryMutations();
  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSelectedIcon(category.icon);
      setSelectedColor(category.color);
    } else {
      setName('');
      setSelectedIcon('tag');
      setSelectedColor('#61710C');
    }
  }, [category, open]);

  const getIconComponent = (iconName: string) => {
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore
    return LucideIcons[pascalCase] || LucideIcons.Tag;
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const categoryData = {
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type,
    };

    if (isEditing) {
      updateCategory.mutate({
        id: category.id,
        ...categoryData,
      }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      addCategory.mutate(categoryData, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const isLoading = addCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              placeholder="Ex: Alimentação, Salário..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-3 max-h-60 overflow-y-auto p-4 border rounded-lg bg-gray-50">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedIcon === iconName
                        ? 'border-[#61710C] bg-white shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: selectedColor }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Cor</Label>
            <div className="grid grid-cols-8 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color
                      ? 'border-gray-400 shadow-md'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-4 bg-white border-2 border-dashed rounded-lg">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                {(() => {
                  const IconComponent = getIconComponent(selectedIcon);
                  return <IconComponent className="w-5 h-5" style={{ color: selectedColor }} />;
                })()}
              </div>
              <span className="font-medium text-gray-900">
                {name || 'Nome da categoria'}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                {type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="flex-1 bg-[#61710C] text-[#CFF500] hover:bg-[#4a5709]"
          >
            {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
