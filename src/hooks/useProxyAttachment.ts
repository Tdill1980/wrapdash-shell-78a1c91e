import { useState, useCallback } from "react";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Domains that need proxying due to browser blocks
const BLOCKED_DOMAINS = [
  "lookaside.fbsbx.com",
  "scontent.xx.fbcdn.net",
  "fbcdn.net",
  "cdninstagram.com",
];

export function needsProxy(url: string): boolean {
  try {
    const parsed = new URL(url);
    return BLOCKED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith("." + domain) ||
        parsed.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

interface ProxyResult {
  signedUrl: string;
  cached: boolean;
  contentType?: string;
}

export function useProxyAttachment() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const proxyAndOpen = useCallback(async (url: string) => {
    if (!needsProxy(url)) {
      // Direct open for non-blocked URLs
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setLoading((prev) => ({ ...prev, [url]: true }));

    try {
      const { data, error } = await lovableFunctions.functions.invoke("proxy-external-attachment", {
        body: { url },
      });

      if (error || data?.error) {
        console.error("Proxy error:", error || data?.error);
        // Handle expired attachments gracefully
        if (data?.error === "attachment_expired") {
          toast.error("This attachment has expired and is no longer available.");
        } else {
          toast.error("Attachment couldn't be retrieved. The link may have expired.");
        }
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Failed to retrieve attachment");
      }
    } catch (err) {
      console.error("Proxy fetch error:", err);
      toast.error("Attachment couldn't be fetched");
    } finally {
      setLoading((prev) => ({ ...prev, [url]: false }));
    }
  }, []);

  const getProxiedUrl = useCallback(async (url: string): Promise<string | null> => {
    if (!needsProxy(url)) {
      return url;
    }

    try {
      const { data, error } = await lovableFunctions.functions.invoke("proxy-external-attachment", {
        body: { url },
      });

      if (error || !data?.signedUrl) {
        console.error("Proxy error:", error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error("Proxy fetch error:", err);
      return null;
    }
  }, []);

  return {
    proxyAndOpen,
    getProxiedUrl,
    loading,
    needsProxy,
  };
}
