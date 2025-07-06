
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import * as LucideIcons from "lucide-react";

interface CategoryCardProps {
  category: any;
  onEdit: (category: any) => void;
}

export function CategoryCard({ category, onEdit }: CategoryCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getIconComponent = (iconName: string) => {
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore
    return LucideIcons[pascalCase] || LucideIcons.Tag;
  };

  const IconComponent = getIconComponent(category.icon);

  return (
    <>
      <Card className="bg-white border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <IconComponent 
                  className="w-5 h-5" 
                  style={{ color: category.color }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-[#121212]">{category.name}</h3>
                <p className="text-xs text-[#64748B] capitalize">{category.type}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={category}
      />
    </>
  );
}
