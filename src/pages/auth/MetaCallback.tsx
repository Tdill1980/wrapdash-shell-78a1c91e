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

  const notifyOpenerAndClose = (success: boolean, message?: string) => {
    // Notify opener window via postMessage
    if (window.opener) {
      window.opener.postMessage(
        { 
          type: success ? "META_AUTH_SUCCESS" : "META_AUTH_ERROR",
          message 
        },
        window.location.origin
      );
      // Close popup after short delay
      setTimeout(() => window.close(), 2000);
    } else {
      // Not a popup - redirect normally
      setTimeout(() => navigate("/settings/instagram"), 2000);
    }
  };

  const handleCallback = async () => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Validate state for CSRF protection
    const savedState = localStorage.getItem("meta_oauth_state");
    if (state && savedState && state !== savedState) {
      setStatus("error");
      setMessage("Security validation failed - please try again");
      notifyOpenerAndClose(false, "Security validation failed");
      return;
    }
    localStorage.removeItem("meta_oauth_state");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || "Facebook login was cancelled or failed");
      toast.error("Failed to connect Instagram", {
        description: errorDescription || "Please try again"
      });
      notifyOpenerAndClose(false, errorDescription);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Facebook");
      notifyOpenerAndClose(false, "No authorization code received");
      return;
    }

    try {
      setMessage("Exchanging authorization code...");

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
      const successMsg = `Connected to ${data.page_name || "Facebook Page"}${data.instagram_username ? ` (@${data.instagram_username})` : ""}`;
      setMessage(successMsg);
      
      toast.success("Instagram connected!", {
        description: "You can now receive and reply to DMs in MightyChat"
      });

      notifyOpenerAndClose(true);

    } catch (err) {
      console.error("Meta callback error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to connect Instagram";
      setStatus("error");
      setMessage(errorMsg);
      toast.error("Connection failed", {
        description: errorMsg
      });
      notifyOpenerAndClose(false, errorMsg);
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
              {window.opener ? "This window will close automatically..." : "Redirecting to settings..."}
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
              {window.opener ? "This window will close automatically..." : "Redirecting to settings..."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
