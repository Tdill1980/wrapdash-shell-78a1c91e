import { Check, Sparkles, Zap, Package, MessageSquare } from "lucide-react";

interface ActivationStepProps {
  businessName: string;
  servicesCount: number;
}

export const ActivationStep = ({ businessName, servicesCount }: ActivationStepProps) => {
  const achievements = [
    { icon: Sparkles, label: "TradeDNA Profile", status: "Active" },
    { icon: Package, label: "Services Configured", status: `${servicesCount} products` },
    { icon: Zap, label: "AI Voice", status: "Personalized" },
    { icon: MessageSquare, label: "Ready for Quotes", status: "Enabled" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success Header */}
      <div className="text-center">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-400 rounded-full">
            <Check className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-2">
          You're a Legend! 🏆
        </h2>
        <p className="text-xl text-primary font-medium mb-1">
          TradeDNA is Live!
        </p>
        <p className="text-muted-foreground">
          {businessName} is ready to roll
        </p>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-card/50 backdrop-blur-xl border border-white/10 text-center"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="inline-flex p-3 rounded-xl bg-green-500/10 mb-3">
              <achievement.icon className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-foreground">{achievement.label}</p>
            <p className="text-xs text-green-400">{achievement.status}</p>
          </div>
        ))}
      </div>

      {/* Motivational Message */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-500/5 border border-primary/20 text-center">
        <p className="text-lg text-foreground mb-2">
          Your AI now speaks <span className="text-primary font-bold">YOUR</span> language
        </p>
        <p className="text-sm text-muted-foreground">
          Every quote, email, and message will sound like you wrote it
        </p>
      </div>

      {/* Redirect Message */}
      <p className="text-center text-sm text-muted-foreground animate-pulse">
        Taking you to your dashboard in a moment...
      </p>
    </div>
  );
};
