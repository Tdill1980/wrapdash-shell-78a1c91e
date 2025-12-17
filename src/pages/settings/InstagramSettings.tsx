import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instagram, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Unplug } from "lucide-react";
import { format, formatDistanceToNow, isPast, addDays } from "date-fns";

interface TokenInfo {
  id: string;
  page_name: string | null;
  instagram_username: string | null;
  expires_at: string | null;
  last_refreshed_at: string | null;
  page_id: string | null;
}

export default function InstagramSettings() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTokenInfo();
  }, []);

  const loadTokenInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instagram_tokens")
        .select("id, page_name, instagram_username, expires_at, last_refreshed_at, page_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setTokenInfo(data);
    } catch (err) {
      console.error("Failed to load token info:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Meta OAuth URL - redirect to Facebook Login
    const appId = "1099408548599498"; // Your Meta App ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/meta/callback`);
    const scopes = [
      "pages_show_list",
      "business_management", 
      "pages_read_engagement",
      "pages_messaging",
      "instagram_basic",
      "instagram_manage_messages"
    ].join(",");

    const oauthUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
    
    // Open in new window to avoid iframe restrictions (Facebook blocks X-Frame-Options)
    window.open(oauthUrl, "_blank", "width=600,height=700,scrollbars=yes");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-instagram-token", {
        body: { force: true }
      });

      if (error) throw error;

      if (data?.refreshed > 0) {
        toast.success("Token refreshed successfully!");
        loadTokenInfo();
      } else {
        toast.info("Token is still valid, no refresh needed");
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      toast.error("Failed to refresh token");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tokenInfo?.id) return;
    
    if (!confirm("Are you sure you want to disconnect Instagram? You'll need to reconnect to send/receive DMs.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("instagram_tokens")
        .delete()
        .eq("id", tokenInfo.id);

      if (error) throw error;
      
      toast.success("Instagram disconnected");
      setTokenInfo(null);
    } catch (err) {
      console.error("Disconnect error:", err);
      toast.error("Failed to disconnect");
    }
  };

  const isExpired = tokenInfo?.expires_at ? isPast(new Date(tokenInfo.expires_at)) : false;
  const expiresWithin7Days = tokenInfo?.expires_at 
    ? new Date(tokenInfo.expires_at) < addDays(new Date(), 7) && !isExpired
    : false;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Instagram Settings</h1>
          <p className="text-muted-foreground">Connect and manage your Instagram Business account</p>
        </div>
        
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Instagram Connection
            </CardTitle>
            <CardDescription>
              Connect your Instagram Business account to receive and reply to DMs in MightyChat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tokenInfo ? (
              <>
                {/* Connected Status */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium text-green-700 dark:text-green-400">Connected</p>
                    <p className="text-sm text-muted-foreground">
                      {tokenInfo.page_name || "Facebook Page"}
                      {tokenInfo.instagram_username && (
                        <span className="ml-2">(@{tokenInfo.instagram_username})</span>
                      )}
                    </p>
                  </div>
                  {tokenInfo.instagram_username && (
                    <a
                      href={`https://instagram.com/${tokenInfo.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Token Expiry Status */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  isExpired 
                    ? "bg-red-500/10 border-red-500/20" 
                    : expiresWithin7Days
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : "bg-muted/50 border-border"
                }`}>
                  {isExpired ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : expiresWithin7Days ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isExpired ? "Token Expired" : "Token Status"}
                    </p>
                    {tokenInfo.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        {isExpired 
                          ? `Expired ${formatDistanceToNow(new Date(tokenInfo.expires_at))} ago`
                          : `Expires ${formatDistanceToNow(new Date(tokenInfo.expires_at), { addSuffix: true })}`
                        }
                        <span className="ml-2 opacity-60">
                          ({format(new Date(tokenInfo.expires_at), "MMM d, yyyy")})
                        </span>
                      </p>
                    )}
                  </div>
                  {(isExpired || expiresWithin7Days) && (
                    <Badge variant={isExpired ? "destructive" : "secondary"}>
                      {isExpired ? "Needs Reconnect" : "Refresh Soon"}
                    </Badge>
                  )}
                </div>

                {/* Last Refreshed */}
                {tokenInfo.last_refreshed_at && (
                  <p className="text-xs text-muted-foreground">
                    Last refreshed: {format(new Date(tokenInfo.last_refreshed_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    className="flex-1"
                  >
                    {refreshing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh Token
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>

                {isExpired && (
                  <Button onClick={handleConnect} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    <Instagram className="h-4 w-4 mr-2" />
                    Reconnect Instagram
                  </Button>
                )}
              </>
            ) : (
              /* Not Connected State */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your Instagram Business account to start receiving DMs
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleConnect} 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  size="lg"
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  Connect Instagram
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to Facebook to authorize access to your Instagram Business account
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">60-day tokens:</strong> After connecting, your access token is valid for ~60 days. 
              The system automatically refreshes tokens before they expire.
            </p>
            <p>
              <strong className="text-foreground">Requirements:</strong> You need an Instagram Business or Creator account 
              connected to a Facebook Page. Personal Instagram accounts are not supported by Meta's API.
            </p>
            <p>
              <strong className="text-foreground">Permissions:</strong> We request access to read and reply to your Instagram DMs, 
              view your Page info, and see who messages you (including their username).
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
