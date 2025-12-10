import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Image,
  Images,
  Sparkles,
  Type,
  Palette,
  Download,
} from "lucide-react";

export default function StaticCreator() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organic")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <Images className="w-5 h-5" />
                Static / Carousel Creator
              </h1>
              <p className="text-xs text-muted-foreground">
                Create organic static posts & carousels
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Single Post */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#405DE6] to-[#833AB4] flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Single Post</h3>
              <p className="text-sm text-muted-foreground">
                Create a single static image post with AI-generated copy
              </p>
              <Button className="mt-4" variant="outline">
                Create Post
              </Button>
            </CardContent>
          </Card>

          {/* Carousel */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833AB4] to-[#E1306C] flex items-center justify-center mx-auto mb-4">
                <Images className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Carousel</h3>
              <p className="text-sm text-muted-foreground">
                Create a multi-slide carousel with cohesive design
              </p>
              <Button className="mt-4" variant="outline">
                Create Carousel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Templates */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Before/After", "Quote Card", "Tips List", "Product Feature"].map(
                (template) => (
                  <div
                    key={template}
                    className="aspect-square rounded-lg bg-muted/50 border border-border hover:border-primary/50 cursor-pointer flex items-center justify-center p-4 text-center transition-colors"
                  >
                    <span className="text-sm font-medium">{template}</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
