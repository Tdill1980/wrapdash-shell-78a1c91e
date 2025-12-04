import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import wrapCommandLogo from "@/assets/wrapcommand-logo-new.png";

export default function ComingSoon() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("launch_signups")
        .insert({ email: trimmedEmail });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - already signed up
          toast({
            title: "Already on the list!",
            description: "This email is already signed up. We'll notify you when we launch.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "You're on the list!",
          description: "We'll notify you when WrapCommand AI launches.",
        });
        setEmail("");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="text-center relative z-10 max-w-lg w-full">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={wrapCommandLogo} 
            alt="WrapCommand" 
            className="h-20 w-auto mb-3"
          />
          <span className="text-4xl font-bold bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">
            AI
          </span>
        </div>

        {/* Coming Soon Text */}
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Coming Soon
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          We're preparing something amazing for the wrap industry.
        </p>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-4 bg-card/30 backdrop-blur-sm rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">AI-Powered</p>
            <p className="font-semibold text-foreground">Quoting</p>
          </div>
          <div className="p-4 bg-card/30 backdrop-blur-sm rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">Smart</p>
            <p className="font-semibold text-foreground">Production</p>
          </div>
          <div className="p-4 bg-card/30 backdrop-blur-sm rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">Automated</p>
            <p className="font-semibold text-foreground">Workflows</p>
          </div>
        </div>

        {/* Email Signup Form */}
        <form onSubmit={handleSignup} className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button 
              type="submit"
              disabled={isLoading || !email.trim()}
              className="bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] text-white hover:opacity-90 whitespace-nowrap"
            >
              {isLoading ? "Signing up..." : "Notify Me"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Be the first to know when we launch. No spam, ever.
          </p>
        </form>

        {/* Admin Login */}
        <Button 
          variant="outline" 
          onClick={() => navigate("/auth")}
          className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
        >
          Admin Login
        </Button>
      </div>
    </div>
  );
}
