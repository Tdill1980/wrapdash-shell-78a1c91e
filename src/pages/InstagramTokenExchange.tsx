import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2, Instagram } from "lucide-react";

const InstagramTokenExchange = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExchange = async () => {
    if (!token.trim()) {
      toast.error("Please paste your short-lived token");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await lovableFunctions.functions.invoke("exchange-instagram-token", {
        body: { short_lived_token: token.trim() },
      });

      if (error) throw error;

      setResult(data);
      toast.success("Token exchanged successfully! Valid for 60 days.");
    } catch (err: any) {
      console.error("Exchange error:", err);
      toast.error(err.message || "Failed to exchange token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] flex items-center justify-center">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Instagram Token Exchange</CardTitle>
          <CardDescription>
            Paste your short-lived token below to get a 60-day long-lived token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result ? (
            <>
              <Input
                placeholder="Paste your short-lived token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleExchange} 
                disabled={loading || !token.trim()}
                className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exchanging...
                  </>
                ) : (
                  "Exchange Token"
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Token exchanged successfully!</span>
              </div>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <p><strong>Expires:</strong> {new Date(result.expires_at).toLocaleDateString()}</p>
                <p><strong>Valid for:</strong> {result.expires_in_days} days</p>
                <p><strong>Stored in DB:</strong> {result.stored_in_db ? "Yes ✓" : "No"}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">New long-lived token:</p>
                <code className="text-xs break-all">{result.access_token}</code>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(result.access_token);
                  toast.success("Token copied to clipboard");
                }}
                className="w-full"
              >
                Copy Token
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramTokenExchange;
