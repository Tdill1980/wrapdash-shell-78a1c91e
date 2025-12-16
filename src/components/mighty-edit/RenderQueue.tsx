import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Film, Download, ExternalLink, Clock, CheckCircle, Loader2 } from "lucide-react";
import { VideoEditItem } from "@/hooks/useMightyEdit";

interface RenderQueueProps {
  editQueue: VideoEditItem[];
}

export function RenderQueue({ editQueue }: RenderQueueProps) {
  const renderingItems = editQueue.filter(v => v.render_status === "rendering" || v.status === "rendering");
  const completedItems = editQueue.filter(v => v.status === "complete" || v.final_render_url);

  return (
    <div className="space-y-6">
      {/* Currently Rendering */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
            Currently Rendering ({renderingItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderingItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Film className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No videos currently rendering</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderingItems.map((video) => (
                <div key={video.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-24 h-14 bg-black/50 rounded overflow-hidden flex-shrink-0">
                    <video src={video.source_url} className="w-full h-full object-cover" muted />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={50} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">Rendering...</span>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-500">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Renders */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Completed ({completedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No completed renders yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedItems.map((video) => (
                <Card key={video.id} className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                      <video 
                        src={video.final_render_url || video.source_url} 
                        className="w-full h-full object-cover"
                        controls
                      />
                      <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    </div>

                    {/* Info */}
                    <div>
                      <h4 className="font-medium text-foreground truncate">{video.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rendered {new Date(video.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Shorts Extracted */}
                    {video.shorts_extracted && video.shorts_extracted.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Film className="w-4 h-4" />
                        <span>{video.shorts_extracted.length} shorts extracted</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {video.final_render_url && (
                        <Button size="sm" className="flex-1" asChild>
                          <a href={video.final_render_url} download>
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
