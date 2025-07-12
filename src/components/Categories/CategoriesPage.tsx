
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { AddEditCategoryModal } from "./AddEditCategoryModal";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"despesa" | "receita">("despesa");
  
  const { data: categories = [], isLoading } = useCategories();

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = category.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddCategory = (type: "despesa" | "receita") => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#121212]">Categorias</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="despesa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-gray-100 border border-gray-200">
          <TabsTrigger 
            value="despesa" 
            onClick={() => setSelectedType("despesa")}
            className="data-[state=active]:bg-white data-[state=active]:text-[#121212] data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-[#61710C] font-medium"
          >
            Despesas
          </TabsTrigger>
          <TabsTrigger 
            value="receita" 
            onClick={() => setSelectedType("receita")}
            className="data-[state=active]:bg-white data-[state=active]:text-[#121212] data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-[#61710C] font-medium"
          >
            Receitas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="despesa" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#121212]">
              Categorias de Despesas ({categories.filter(c => c.type === "despesa").length})
            </h2>
            <Button 
              onClick={() => handleAddCategory("despesa")} 
              className="bg-[#61710C] hover:bg-[#4a5709] text-white"
            >
              <Plus className="h-4 w-4 mr-2 text-white" />
              Adicionar Categoria
            </Button>
          </div>

          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Nenhuma categoria encontrada</p>
                  <p className="text-sm">
                    {searchTerm ? "Tente buscar por outro termo." : "Adicione sua primeira categoria de despesa."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="receita" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#121212]">
              Categorias de Receitas ({categories.filter(c => c.type === "receita").length})
            </h2>
            <Button 
              onClick={() => handleAddCategory("receita")} 
              className="bg-[#61710C] hover:bg-[#4a5709] text-white"
            >
              <Plus className="h-4 w-4 mr-2 text-white" />
              Adicionar Categoria
            </Button>
          </div>

          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Nenhuma categoria encontrada</p>
                  <p className="text-sm">
                    {searchTerm ? "Tente buscar por outro termo." : "Adicione sua primeira categoria de receita."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddEditCategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categoryType={selectedType}
      />
    </div>
  );
}
