
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Trash2, Tag } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { AddEditCategoryModal } from "./AddEditCategoryModal";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getIconComponent = (iconName: string) => {
    if (!iconName) return Tag;
    
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore - Dynamic icon access
    return LucideIcons[pascalCase] || Tag;
  };

  const IconComponent = getIconComponent(category.icon);

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 border-[#DEDEDE]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: category.color }}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-[#DEDEDE]">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <h3 className="font-medium text-[#121212] mb-1">{category.name}</h3>
            <span className="text-xs text-gray-500 capitalize">
              {category.type}
            </span>
          </div>
        </CardContent>
      </Card>

      <AddEditCategoryModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        category={category}
        categoryType={category.type as "despesa" | "receita"}
      />

      <DeleteCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={category}
      />
    </>
  );
}
