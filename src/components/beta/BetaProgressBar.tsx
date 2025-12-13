import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface BetaProgressBarProps {
  steps: Step[];
  currentStep: number;
}

export const BetaProgressBar = ({ steps, currentStep }: BetaProgressBarProps) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-md px-4">
      {/* Progress track */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Animated gradient progress */}
        <div
          className="absolute top-4 left-0 h-1 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(198, 100%, 50%), hsl(180, 100%, 50%), hsl(280, 80%, 60%))",
            boxShadow: "0 0 20px hsl(198, 100%, 50%), 0 0 40px hsl(198, 100%, 50%)",
          }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-500 relative z-10
                    ${isCompleted 
                      ? "bg-gradient-to-r from-primary to-cyan-400" 
                      : isCurrent 
                        ? "bg-gradient-to-r from-primary to-cyan-400 ring-4 ring-primary/30" 
                        : "bg-muted border-2 border-muted-foreground/30"
                    }
                  `}
                  style={isCurrent ? {
                    boxShadow: "0 0 20px hsl(198, 100%, 50%), 0 0 40px hsl(198, 100%, 50%)",
                  } : {}}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className={`text-sm font-bold ${isCurrent ? "text-white" : "text-muted-foreground"}`}>
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium transition-colors duration-300
                    ${isCompleted || isCurrent ? "text-primary" : "text-muted-foreground"}
                  `}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Percentage indicator */}
      <div className="mt-6 text-center">
        <span className="text-2xl font-bold text-gradient">{Math.round(progress)}%</span>
        <span className="text-muted-foreground ml-2 text-sm">Complete</span>
      </div>
    </div>
  );
};
