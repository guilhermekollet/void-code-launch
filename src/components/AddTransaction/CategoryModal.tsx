
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddCategory } from "@/hooks/useAddCategory";
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (categoryName: string) => void;
  categoryType?: "despesa" | "receita";
}

const CATEGORY_ICONS = [
  'home', 'car', 'shopping-cart', 'utensils', 'shirt', 'briefcase',
  'heart', 'gamepad', 'plane', 'fuel', 'stethoscope', 'book',
  'coffee', 'gift', 'phone', 'laptop', 'dumbbell', 'music',
  'dollar-sign', 'piggy-bank', 'trending-up', 'credit-card', 'coins', 'banknote'
];

const CATEGORY_COLORS = [
  '#EF4444', '#DC2626', '#B91C1C', '#F59E0B', '#D97706', '#B45309',
  '#F97316', '#EA580C', '#C2410C', '#84CC16', '#65A30D', '#4D7C0F',
  '#06B6D4', '#0891B2', '#0E7490', '#3B82F6', '#2563EB', '#1D4ED8'
];

export function CategoryModal({ 
  open, 
  onOpenChange, 
  onCategoryCreated,
  categoryType = "despesa"
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("tag");
  const [selectedColor, setSelectedColor] = useState("#EF4444");

  const { mutate: addCategory, isPending } = useAddCategory();

  useEffect(() => {
    if (!open) {
      setName("");
      setSelectedIcon("tag");
      setSelectedColor("#EF4444");
    }
  }, [open]);

  const getIconComponent = (iconName: string) => {
    if (!iconName) return Tag;
    
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore - Dynamic icon access
    return LucideIcons[pascalCase] || Tag;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: categoryType
    }, {
      onSuccess: () => {
        if (onCategoryCreated) {
          onCategoryCreated(name.trim());
        }
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>
            Adicionar Categoria de {categoryType === 'despesa' ? 'Despesa' : 'Receita'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alimentação, Salário..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = getIconComponent(selectedIcon);
                      return <IconComponent className="w-4 h-4" style={{ color: selectedColor }} />;
                    })()}
                    <span className="capitalize">{selectedIcon.replace('-', ' ')}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#DEDEDE] max-h-60">
                {CATEGORY_ICONS.map((icon) => {
                  const IconComponent = getIconComponent(icon);
                  return (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" style={{ color: selectedColor }} />
                        <span className="capitalize">{icon.replace('-', ' ')}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#61710C] hover:bg-[#4a5709]"
              disabled={isPending || !name.trim()}
            >
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
