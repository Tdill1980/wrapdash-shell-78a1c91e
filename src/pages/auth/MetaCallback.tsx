import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function MetaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your Instagram account...");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || "Facebook login was cancelled or failed");
      toast.error("Failed to connect Instagram", {
        description: errorDescription || "Please try again"
      });
      setTimeout(() => navigate("/settings/instagram"), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Facebook");
      setTimeout(() => navigate("/settings/instagram"), 3000);
      return;
    }

    try {
      setMessage("Exchanging authorization code...");

      // Step 1: Exchange code for short-lived token (must be done server-side)
      // We'll call an edge function to handle the OAuth token exchange
      const { data, error: fnError } = await supabase.functions.invoke("meta-oauth-exchange", {
        body: { 
          code,
          redirectUri: `${window.location.origin}/auth/meta/callback`
        }
      });

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      setStatus("success");
      setMessage(`Connected to ${data.page_name || "Facebook Page"}${data.instagram_username ? ` (@${data.instagram_username})` : ""}`);
      
      toast.success("Instagram connected!", {
        description: "You can now receive and reply to DMs in MightyChat"
      });

      setTimeout(() => navigate("/settings/instagram"), 2000);

    } catch (err) {
      console.error("Meta callback error:", err);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to connect Instagram");
      toast.error("Connection failed", {
        description: err instanceof Error ? err.message : "Please try again"
      });
      setTimeout(() => navigate("/settings/instagram"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto" />
            <h1 className="text-xl font-semibold">{message}</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we connect your account...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-green-600 dark:text-green-400">
              Success!
            </h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to settings...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Connection Failed
            </h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to settings...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
