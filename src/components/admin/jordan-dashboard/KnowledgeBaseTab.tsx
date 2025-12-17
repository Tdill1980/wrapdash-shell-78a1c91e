import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Database, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const KB_ITEMS = [
  { category: "Pricing", title: "Printed Wrap Film", content: "Avery MPI 1105 - $5.27/sqft" },
  { category: "Pricing", title: "3M IJ180", content: "3M IJ180Cv3 - $6.32/sqft" },
  { category: "Pricing", title: "Window Perf", content: "50/50 Window Perf - $5.32/sqft" },
  { category: "Pricing", title: "Fade Wraps", content: "$600 flat rate" },
  { category: "Pricing", title: "Custom Design", content: "$750 per design" },
  { category: "Production", title: "Turnaround", content: "1-2 days production, 1-3 days shipping" },
  { category: "Production", title: "Free Shipping", content: "Free on orders over $750" },
  { category: "Policy", title: "File Hold", content: "10-day file hold policy" },
  { category: "Policy", title: "File Output Fee", content: "$95 file output fee" },
  { category: "Contact", title: "Email Required", content: "Email required for all quotes" },
];

export function KnowledgeBaseTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = KB_ITEMS.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(KB_ITEMS.map(item => item.category))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{KB_ITEMS.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Knowledge Base Items */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredItems
                .filter(item => item.category === category)
                .map((item, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.content}</div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
