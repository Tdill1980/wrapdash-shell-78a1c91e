import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import wrapCommandLogo from "@/assets/wrapcommand-logo-new.png";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="text-center relative z-10 max-w-lg">
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
