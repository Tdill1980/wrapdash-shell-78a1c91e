import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Instagram, Facebook, Youtube, Music2, 
  CheckCircle, AlertCircle, Link2, Unlink, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
  lastSync?: string;
  expiresAt?: string;
}

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-purple-500",
    description: "Connect to post Reels, Stories, and Feed posts",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "from-blue-600 to-blue-400",
    description: "Connect to post to your Facebook Page",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    color: "from-black to-gray-700",
    description: "Connect to post videos and clips",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "from-red-600 to-red-400",
    description: "Connect to upload Shorts and videos",
  },
];

export function SocialAccountsConnect() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { id: "1", platform: "instagram", username: "@weprintwraps", connected: true, lastSync: "2 hours ago" },
  ]);
  const [autoPublish, setAutoPublish] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success(`${platformId} connection initiated. Complete authorization in the popup.`);
    setConnecting(null);
  };

  const handleDisconnect = (platformId: string) => {
    setAccounts(accounts.filter((a) => a.platform !== platformId));
    toast.success("Account disconnected");
  };

  const getAccount = (platformId: string) => 
    accounts.find((a) => a.platform === platformId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to enable auto-publishing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Auto-publish</span>
          <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const account = getAccount(platform.id);
          const isConnected = !!account?.connected;
          const isConnecting = connecting === platform.id;

          return (
            <Card key={platform.id} className={isConnected ? "border-green-500/30" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Platform Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                    <platform.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Platform Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{platform.name}</h3>
                      {isConnected ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <AlertCircle className="w-3 h-3" />
                          Not connected
                        </Badge>
                      )}
                    </div>
                    
                    {isConnected && account ? (
                      <div className="mt-1">
                        <p className="text-sm font-medium">{account.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Last synced: {account.lastSync}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {platform.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {isConnected ? (
                      <>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sync
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDisconnect(platform.id)}
                        >
                          <Unlink className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Auto-publish Settings */}
      {autoPublish && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Auto-Publish Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Publish approved content automatically</span>
              <Badge>Enabled</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              When content is marked as "Approved" and has a scheduled time, it will be 
              automatically published to connected accounts at the scheduled time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Publishing Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Publishing Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Instagram Reels work best at 9:16 aspect ratio (1080x1920)</p>
          <p>• TikTok videos should be under 3 minutes for best engagement</p>
          <p>• Facebook Pages require business account authorization</p>
          <p>• YouTube Shorts must be under 60 seconds</p>
        </CardContent>
      </Card>
    </div>
  );
}
