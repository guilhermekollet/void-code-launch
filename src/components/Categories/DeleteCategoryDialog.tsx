
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCategoryMutations } from "@/hooks/useCategoryMutations";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: any;
}

export function DeleteCategoryDialog({ open, onOpenChange, category }: DeleteCategoryDialogProps) {
  const { deleteCategory } = useCategoryMutations();

  const handleDelete = () => {
    deleteCategory.mutate(category.id, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a categoria "{category?.name}"? 
            Esta ação não pode ser desfeita e pode afetar transações existentes que usam esta categoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteCategory.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
