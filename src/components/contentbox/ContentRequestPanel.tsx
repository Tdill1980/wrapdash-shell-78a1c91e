import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Video, 
  Newspaper, 
  Lightbulb, 
  Target,
  ChevronRight
} from "lucide-react";
import { ContentRequestModal, RequestType } from "./ContentRequestModal";

const REQUEST_BUTTONS = [
  {
    type: "email" as RequestType,
    label: "Email / Campaign",
    agent: "Emily Carter",
    icon: Mail,
    color: "from-blue-500 to-blue-600",
    description: "Sales emails, Wrap of the Week, newsletters"
  },
  {
    type: "reel" as RequestType,
    label: "Reels / Social",
    agent: "Noah Bennett",
    icon: Video,
    color: "from-pink-500 to-rose-600",
    description: "IG Reels, TikToks, short-form content"
  },
  {
    type: "magazine" as RequestType,
    label: "Magazine / Editorial",
    agent: "Ryan Mitchell",
    icon: Newspaper,
    color: "from-purple-500 to-violet-600",
    description: "Ink & Edge features, long-form authority"
  },
  {
    type: "ideas" as RequestType,
    label: "Content Ideas",
    agent: "Backlog",
    icon: Lightbulb,
    color: "from-amber-500 to-orange-600",
    description: "Save ideas for later"
  },
  {
    type: "sales" as RequestType,
    label: "Sales Strategy",
    agent: "Taylor / Evan",
    icon: Target,
    color: "from-emerald-500 to-green-600",
    description: "Content tied to closing leads"
  }
];

export function ContentRequestPanel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>("email");

  const handleOpenRequest = (type: RequestType) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  return (
    <>
      <Card className="p-4 md:p-6 mb-6 bg-gradient-to-br from-card to-muted/30 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              📝 What do you need?
            </h2>
            <p className="text-sm text-muted-foreground">
              Ask the right agent — they'll build it in ContentBox
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REQUEST_BUTTONS.map((btn) => (
            <Button
              key={btn.type}
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 transition-all group relative overflow-hidden"
              onClick={() => handleOpenRequest(btn.type)}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${btn.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className="flex items-center gap-2 w-full mb-2">
                <div className={`p-1.5 rounded-md bg-gradient-to-br ${btn.color}`}>
                  <btn.icon className="w-4 h-4 text-white" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <span className="text-sm font-medium text-foreground text-left">
                {btn.label}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                → {btn.agent}
              </span>
            </Button>
          ))}
        </div>
      </Card>

      <ContentRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requestType={selectedType}
      />
    </>
  );
}
