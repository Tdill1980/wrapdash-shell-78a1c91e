import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Sparkles, Brain, MessageSquare, Users, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepAnalysisProps {
  isAnalyzing: boolean;
  isComplete: boolean;
}

const analysisSteps = [
  { id: 'scraping', label: 'Processing content', icon: FileText },
  { id: 'tone', label: 'Detecting tone patterns', icon: Sparkles },
  { id: 'vocabulary', label: 'Extracting vocabulary', icon: MessageSquare },
  { id: 'psychology', label: 'Analyzing customer psychology', icon: Users },
  { id: 'sales', label: 'Identifying sales style', icon: Zap },
  { id: 'building', label: 'Building TradeDNA profile', icon: Brain }
];

export const WizardStepAnalysis = ({ isAnalyzing, isComplete }: WizardStepAnalysisProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isAnalyzing && !isComplete) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < analysisSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
    if (isComplete) {
      setCurrentStep(analysisSteps.length);
    }
  }, [isAnalyzing, isComplete]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">AI Analysis</h2>
          <p className="text-sm text-muted-foreground">
            {isComplete ? 'Analysis complete!' : 'Analyzing your brand voice...'}
          </p>
        </div>
      </div>

      <div className="py-6">
        <div className="space-y-4">
          {analysisSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep && isAnalyzing;
            const isDone = index < currentStep || isComplete;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                  isActive && "bg-primary/10 border border-primary/30",
                  isDone && "bg-green-500/10",
                  !isActive && !isDone && "opacity-40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isActive && "bg-primary/20",
                  isDone && "bg-green-500/20"
                )}>
                  {isActive ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <span className={cn(
                  "font-medium",
                  isActive && "text-primary",
                  isDone && "text-green-500"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isComplete && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-400 font-medium">TradeDNA Profile Generated!</p>
          <p className="text-sm text-muted-foreground mt-1">Review your brand voice profile on the next step</p>
        </div>
      )}
    </div>
  );
};
