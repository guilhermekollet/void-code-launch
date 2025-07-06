
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { AddEditCategoryModal } from "./AddEditCategoryModal";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalType, setModalType] = useState<'receita' | 'despesa'>('despesa');
  const { data: categories = [], isLoading } = useCategories();

  const expenseCategories = categories.filter(cat => cat.type === 'despesa');
  const incomeCategories = categories.filter(cat => cat.type === 'receita');

  const handleAddCategory = (type: 'receita' | 'despesa') => {
    setSelectedCategory(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setModalType(category.type);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#121212]">Categorias</h1>
          <p className="text-[#64748B] mt-1">Gerencie suas categorias de receitas e despesas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#121212]">Categorias</h1>
        <p className="text-[#64748B] mt-1">Gerencie suas categorias de receitas e despesas</p>
      </div>

      <Tabs defaultValue="despesas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="despesas">
          <Card className="bg-white border-[#E2E8F0] shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#121212] text-xl font-semibold">
                  Categorias de Despesas
                </CardTitle>
                <Button
                  onClick={() => handleAddCategory('despesa')}
                  className="bg-[#61710C] text-[#CFF500] hover:bg-[#4a5709]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenseCategories.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <p>Nenhuma categoria de despesa encontrada.</p>
                  <p className="text-sm mt-1">Clique em "Nova Categoria" para criar sua primeira categoria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expenseCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleEditCategory}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas">
          <Card className="bg-white border-[#E2E8F0] shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#121212] text-xl font-semibold">
                  Categorias de Receitas
                </CardTitle>
                <Button
                  onClick={() => handleAddCategory('receita')}
                  className="bg-[#61710C] text-[#CFF500] hover:bg-[#4a5709]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {incomeCategories.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <p>Nenhuma categoria de receita encontrada.</p>
                  <p className="text-sm mt-1">Clique em "Nova Categoria" para criar sua primeira categoria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incomeCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleEditCategory}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddEditCategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={selectedCategory}
        type={modalType}
      />
    </div>
  );
}
