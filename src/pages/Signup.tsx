import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"account" | "organization">("account");
  
  // Account details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Organization details
  const [shopName, setShopName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const checkSubdomainAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    const cleanSubdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(cleanSubdomain);

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('subdomain', cleanSubdomain)
        .single();

      setSubdomainAvailable(!data && !error);
    } catch {
      setSubdomainAvailable(true);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created! Now set up your shop.");
        setStep("organization");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subdomainAvailable) {
      toast.error("Please choose an available subdomain");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          subdomain,
          name: shopName,
          owner_id: user.id,
          subscription_tier: 'pro',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as organization owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast.success("Shop created successfully!");
      
      // Redirect to their subdomain
      window.location.href = `https://${subdomain}.${window.location.hostname.replace('localhost', 'wrapcommand.ai')}/dashboard`;
    } catch (error: any) {
      toast.error(error.message || "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">
            {step === "account" ? "Create Your Account" : "Set Up Your Shop"}
          </CardTitle>
          <CardDescription>
            {step === "account" 
              ? "Start your multi-tenant wrap shop journey"
              : `Your shop will be accessible at ${subdomain || "[subdomain]"}.wrapcommand.ai`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "account" ? (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/auth")}
                >
                  Sign in
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOrganizationSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="VinylVixen Wraps"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="vinylvixen"
                    value={subdomain}
                    onChange={(e) => checkSubdomainAvailability(e.target.value)}
                    required
                    minLength={3}
                    pattern="[a-z0-9-]+"
                  />
                  <span className="text-sm text-muted-foreground">.wrapcommand.ai</span>
                </div>
                {subdomainAvailable === true && (
                  <p className="text-sm text-green-500">✓ Available</p>
                )}
                {subdomainAvailable === false && (
                  <p className="text-sm text-destructive">✗ Already taken</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens. Min 3 characters.
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !subdomainAvailable}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Shop...
                  </>
                ) : (
                  "Create My Shop"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
