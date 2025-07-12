
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full bg-white shadow-sm", className)}>
      {/* Desktop Progress Bar */}
      <div className="hidden sm:flex items-center justify-center px-4 py-3">
        <div className="flex items-center justify-between w-full max-w-2xl">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    index < currentStep
                      ? "bg-[#61710C] text-white"
                      : index === currentStep
                      ? "bg-[#61710C] text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {index + 1}
                </div>
                <span
                  className={cn(
                    "ml-2 text-sm font-medium",
                    index <= currentStep ? "text-[#61710C]" : "text-gray-500"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      "h-0.5 w-full",
                      index < currentStep ? "bg-[#61710C]" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Progress Bar - Only the green bar with 10px height */}
      <div className="block sm:hidden px-4 py-3">
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
