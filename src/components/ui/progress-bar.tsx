
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full bg-white shadow-sm", className)}>
      {/* Progress Bar - Green bar only for all screens */}
      <div className="px-4 py-3">
        <div className="w-full bg-gray-200 h-[10px] rounded-full">
          <div 
            className="bg-[#61710C] h-[10px] rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
