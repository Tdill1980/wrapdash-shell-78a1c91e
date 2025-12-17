import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export function ReviewsTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">4.7</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positive</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">92%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Improvement</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">8%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Recent Customer Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { rating: 5, comment: "Jordan was super helpful explaining the wrap process!", date: "2 hours ago" },
              { rating: 5, comment: "Got my quote instantly, very impressed!", date: "5 hours ago" },
              { rating: 4, comment: "Good response, had a small delay", date: "1 day ago" },
              { rating: 5, comment: "Amazing AI! Knew exactly what I needed.", date: "1 day ago" },
            ].map((review, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-auto">{review.date}</span>
                </div>
                <p className="text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
