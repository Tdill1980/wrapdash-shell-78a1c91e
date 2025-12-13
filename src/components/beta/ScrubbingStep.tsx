import { useEffect, useState } from "react";
import { Loader2, Globe, Instagram, Sparkles, Zap, Target, DollarSign } from "lucide-react";

interface ScrubbingStepProps {
  businessName: string;
}

const MOTIVATIONAL_MESSAGES = [
  { text: "Scanning your website for brand signals...", icon: Globe },
  { text: "Extracting your unique voice...", icon: Sparkles },
  { text: "Detecting your services and pricing...", icon: DollarSign },
  { text: "Analyzing your Instagram presence...", icon: Instagram },
  { text: "Building your TradeDNA profile...", icon: Target },
  { text: "Almost there! You got this! ⚡", icon: Zap },
];

export const ScrubbingStep = ({ businessName }: ScrubbingStepProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rotate messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 2500);

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 300);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentMessage = MOTIVATIONAL_MESSAGES[messageIndex];
  const Icon = currentMessage.icon;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Glassmorphism Card */}
      <div className="relative p-10 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/10 shadow-2xl text-center">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-500/5 pointer-events-none" />

        <div className="relative space-y-8">
          {/* Pulsing DNA icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          </div>

          {/* Business name */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Scrubbing for TradeDNA
            </h2>
            <p className="text-primary font-medium">{businessName}</p>
          </div>

          {/* Animated message */}
          <div className="flex items-center justify-center gap-3 h-12 transition-all duration-500">
            <div
              key={messageIndex}
              className="flex items-center gap-3 animate-fade-in"
            >
              <div className="p-2 rounded-lg bg-primary/20">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground">{currentMessage.text}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, hsl(198, 100%, 50%), hsl(180, 100%, 50%), hsl(280, 80%, 60%))",
                  boxShadow: "0 0 20px hsl(198, 100%, 50%)",
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Scanning animation dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.3 + (i * 0.15),
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <p className="text-center text-sm text-muted-foreground">
        This usually takes 10-15 seconds. Hang tight! 🚀
      </p>
    </div>
  );
};
