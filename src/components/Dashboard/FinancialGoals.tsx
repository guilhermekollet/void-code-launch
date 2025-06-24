import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp } from "lucide-react";

interface Goal {
  id: number;
  title: string;
  target: number;
  progress: number;
  target_date: string;
}

interface FinancialGoalsProps {
  goals: Goal[];
  formatCurrency: (value: number) => string;
}

export function FinancialGoals({ goals, formatCurrency }: FinancialGoalsProps) {
  if (goals.length === 0) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212] flex items-center gap-2">
            <Target className="h-5 w-5 text-[#61710C]" />
            Metas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-[#64748B] mx-auto mb-4" />
            <p className="text-[#64748B]">Nenhuma meta financeira definida</p>
            <p className="text-sm text-[#64748B] mt-2">Defina suas metas para acompanhar seu progresso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[#121212] flex items-center gap-2">
          <Target className="h-5 w-5 text-[#61710C]" />
          Metas Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.slice(0, 3).map((goal) => {
            const progressPercentage = (Number(goal.progress) / Number(goal.target)) * 100;
            const daysUntilTarget = Math.ceil(
              (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#121212]">{goal.title}</p>
                    <p className="text-sm text-[#64748B] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {daysUntilTarget > 0 ? `${daysUntilTarget} dias restantes` : 'Meta expirada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#121212]">
                      {formatCurrency(Number(goal.progress))}
                    </p>
                    <p className="text-sm text-[#64748B]">
                      de {formatCurrency(Number(goal.target))}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={Math.min(progressPercentage, 100)} 
                  className="h-2"
                  style={{
                    background: '#F1F5F9'
                  }}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">{progressPercentage.toFixed(1)}% concluído</span>
                  {progressPercentage >= 100 && (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Meta atingida!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
