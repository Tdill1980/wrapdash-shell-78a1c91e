import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, Eye, MousePointer, AlertCircle } from "lucide-react";

export function EmailTrackingTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            <Mail className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">98.2%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">42.3%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">12.8%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bounces</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">1.8%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Performance by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="font-medium mb-2">Quote Follow-ups</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sent:</span>
                  <span className="ml-2 font-medium">1,247</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Opens:</span>
                  <span className="ml-2 font-medium text-green-500">48%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="ml-2 font-medium text-blue-500">15%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversions:</span>
                  <span className="ml-2 font-medium text-purple-500">8%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="font-medium mb-2">Order Confirmations</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sent:</span>
                  <span className="ml-2 font-medium">892</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Opens:</span>
                  <span className="ml-2 font-medium text-green-500">72%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="ml-2 font-medium text-blue-500">23%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversions:</span>
                  <span className="ml-2 font-medium text-purple-500">—</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="font-medium mb-2">Retargeting</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sent:</span>
                  <span className="ml-2 font-medium">708</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Opens:</span>
                  <span className="ml-2 font-medium text-green-500">35%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="ml-2 font-medium text-blue-500">9%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversions:</span>
                  <span className="ml-2 font-medium text-purple-500">4%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
