
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FinanceCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export function FinanceCard({ title, value, icon: Icon }: FinanceCardProps) {
  return (
    <Card className="bg-[#FDFDFD] border-[#DFDFDF]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#121212]">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#61710C]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#121212]">{value}</div>
      </CardContent>
    </Card>
  );
}
