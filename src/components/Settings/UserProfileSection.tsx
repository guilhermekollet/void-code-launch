
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { DateInputMask } from "@/components/ui/date-input-mask";
import { CityInput } from "@/components/ui/city-input";

export function UserProfileSection() {
  const { data: userProfile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
      
      // Converter data do formato ISO para dd/mm/aaaa
      if (userProfile.birth_date) {
        const date = new Date(userProfile.birth_date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        setBirthDate(`${day}/${month}/${year}`);
      } else {
        setBirthDate("");
      }
      
      setCity(userProfile.city || "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    const updates: any = {
      name: name.trim(),
      email: email.trim(),
      city: city.trim() || null,
    };

    // Converter e validar data de nascimento
    if (birthDate.trim()) {
      const [day, month, year] = birthDate.split('/');
      if (day && month && year && year.length === 4) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
          // age--;
        }
        
        if (age >= 16 && date <= today) {
          updates.birth_date = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }
      }
    } else {
      updates.birth_date = null;
    }

    updateProfile.mutate(updates);
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
    email !== (userProfile?.email || "") ||
    city !== (userProfile?.city || "") ||
    (() => {
      if (!userProfile?.birth_date && !birthDate) return false;
      if (!userProfile?.birth_date) return !!birthDate;
      if (!birthDate) return !!userProfile?.birth_date;
      
      const date = new Date(userProfile.birth_date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      return birthDate !== formattedDate;
    })();

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

        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <DateInputMask
            value={birthDate}
            onChange={setBirthDate}
            placeholder="dd/mm/aaaa"
            className="border-[#DEDEDE] focus:border-[#61710C]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <CityInput
            value={city}
            onValueChange={setCity}
            placeholder="Digite sua cidade"
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
