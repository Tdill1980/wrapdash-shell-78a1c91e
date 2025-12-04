import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioJob } from "@/hooks/usePortfolioJobs";

interface AITaggingSystemProps {
  jobs: PortfolioJob[];
}

const SUGGESTED_TAGS = [
  { category: "Service Type", tags: ["Color Change", "Printed Wrap", "PPF", "Chrome Delete", "Partial Wrap", "Full Wrap"] },
  { category: "Vehicle Type", tags: ["Sedan", "SUV", "Truck", "Van", "Sports Car", "Exotic"] },
  { category: "Finish", tags: ["Gloss", "Matte", "Satin", "Metallic", "Color Shift"] },
  { category: "Client Type", tags: ["Commercial", "Residential", "Fleet", "Dealership"] }
];

export default function AITaggingSystem({ jobs }: AITaggingSystemProps) {
  // Calculate tag frequency
  const tagCounts: Record<string, number> = {};
  jobs.forEach(job => {
    (job.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Current Tags */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Your Tags ({sortedTags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTags.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tags yet. Add jobs with tags to see them here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedTags.map(([tag, count]) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <span className="text-xs opacity-70">({count})</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Tags */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Tags</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use these common industry tags for better organization
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {SUGGESTED_TAGS.map(category => (
            <div key={category.category}>
              <p className="text-sm font-medium mb-2">{category.category}</p>
              <div className="flex flex-wrap gap-2">
                {category.tags.map(tag => {
                  const isUsed = tagCounts[tag] > 0;
                  return (
                    <Badge 
                      key={tag} 
                      variant={isUsed ? "default" : "outline"}
                      className={isUsed ? "bg-pink-500" : ""}
                    >
                      {tag}
                      {isUsed && <span className="ml-1 opacity-70">({tagCounts[tag]})</span>}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">AI Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {jobs.length === 0 ? (
            <p className="text-muted-foreground">
              Add jobs to see AI-powered insights about your portfolio.
            </p>
          ) : (
            <>
              <p>
                <span className="font-medium">Most common work: </span>
                {sortedTags[0]?.[0] || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Total unique tags: </span>
                {sortedTags.length}
              </p>
              <p>
                <span className="font-medium">Avg tags per job: </span>
                {jobs.length > 0 
                  ? (jobs.reduce((sum, j) => sum + (j.tags?.length || 0), 0) / jobs.length).toFixed(1)
                  : 0
                }
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
