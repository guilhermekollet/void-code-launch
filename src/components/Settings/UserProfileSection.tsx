
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";

export function UserProfileSection() {
  const { data: userProfile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    updateProfile.mutate({
      name: name.trim(),
      email: email.trim(),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#61710C]" />
            <CardTitle>Dados do Usuário</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = 
    name !== (userProfile?.name || "") || 
    email !== (userProfile?.email || "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#61710C]" />
          <CardTitle>Dados do Usuário</CardTitle>
        </div>
        <CardDescription>
          Gerencie suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className="border-[#DEDEDE] focus:border-[#61710C]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="border-[#DEDEDE] focus:border-[#61710C]"
          />
        </div>

        <Button 
          onClick={handleSave}
          disabled={updateProfile.isPending || !hasChanges}
          className="w-full bg-white hover:bg-gray-50 text-black border border-[#E2E8F0]"
        >
          {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  );
}
