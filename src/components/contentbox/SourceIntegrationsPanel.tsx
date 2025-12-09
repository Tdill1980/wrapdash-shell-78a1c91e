import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  FolderOpen, 
  Palette, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Link2
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  description: string;
  lastSync?: string;
}

interface SourceIntegrationsPanelProps {
  onConnect: (source: string) => void;
  onSync: (source: string) => void;
  syncing: string | null;
}

export function SourceIntegrationsPanel({ onConnect, onSync, syncing }: SourceIntegrationsPanelProps) {
  const integrations: Integration[] = [
    {
      id: 'canva',
      name: 'Canva',
      icon: <Palette className="w-8 h-8" />,
      connected: false,
      description: 'Import designs, templates, and brand assets from Canva',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: <Cloud className="w-8 h-8" />,
      connected: false,
      description: 'Sync media files from Dropbox folders',
    },
    {
      id: 'google_drive',
      name: 'Google Drive',
      icon: <FolderOpen className="w-8 h-8" />,
      connected: false,
      description: 'Import videos and images from Google Drive',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">Connect Your Content Sources</h2>
        <p className="text-muted-foreground">
          Pull in media from all your creative tools in one place
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {integrations.map((integration) => (
          <Card 
            key={integration.id}
            className="bg-card/50 border-border hover:border-primary/50 transition-all"
          >
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto p-4 rounded-full mb-2 ${
                integration.connected 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {integration.icon}
              </div>
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                {integration.name}
                {integration.connected && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {integration.connected ? (
                <div className="space-y-3">
                  <Badge variant="secondary" className="w-full justify-center py-1">
                    Connected
                  </Badge>
                  {integration.lastSync && (
                    <p className="text-xs text-muted-foreground text-center">
                      Last synced: {integration.lastSync}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSync(integration.id)}
                    disabled={syncing === integration.id}
                  >
                    {syncing === integration.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                  onClick={() => onConnect(integration.id)}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Coming Soon</p>
              <p className="text-xs text-muted-foreground">
                Canva, Dropbox, and Google Drive integrations are in development. Upload files directly for now.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
