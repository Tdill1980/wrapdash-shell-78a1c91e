import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";
import { BetaFormData } from "@/pages/BetaSignup";

interface AccountInfoStepProps {
  formData: BetaFormData;
  setFormData: (data: BetaFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const MOTIVATIONAL_MESSAGES = [
  "Ready to unlock your brand superpowers? 🦸",
  "Let's capture what makes YOU unique ✨",
  "This is where the magic begins 🚀",
];

export const AccountInfoStep = ({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}: AccountInfoStepProps) => {
  const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Motivational Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">{message}</span>
        </div>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

        <div className="relative space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm text-muted-foreground">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm text-muted-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@wrapshop.com"
              className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm text-muted-foreground">
              Business Name *
            </Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Houdini Wraps"
              className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="text-sm text-muted-foreground">
              Website URL (optional but recommended)
            </Label>
            <Input
              id="websiteUrl"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="https://houdiniwraps.com"
              className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagramHandle" className="text-sm text-muted-foreground">
              Instagram Handle *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="instagramHandle"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value.replace("@", "") })}
                placeholder="houdiniwraps"
                className="pl-8 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isLoading || !formData.email || !formData.password || !formData.firstName || !formData.businessName}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-400/90 transition-all duration-300 shadow-lg shadow-primary/25"
        style={{
          boxShadow: "0 0 30px hsl(198, 100%, 50% / 0.3)",
        }}
      >
        <Rocket className="w-5 h-5 mr-2" />
        Let's Go!
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};
