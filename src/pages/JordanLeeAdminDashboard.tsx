import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, BarChart3, Brain, Car, FileEdit, BookOpen, MessageSquare, FileText, FolderSearch, Star, Mail, Wrench } from "lucide-react";
import { AnalyticsTab } from "@/components/admin/jordan-dashboard/AnalyticsTab";
import { AgenticAITab } from "@/components/admin/jordan-dashboard/AgenticAITab";
import { WrapGuruTab } from "@/components/admin/jordan-dashboard/WrapGuruTab";
import { CorrectionsTab } from "@/components/admin/jordan-dashboard/CorrectionsTab";
import { KnowledgeBaseTab } from "@/components/admin/jordan-dashboard/KnowledgeBaseTab";
import { ChatSessionsTab } from "@/components/admin/jordan-dashboard/ChatSessionsTab";
import { QuotesTab } from "@/components/admin/jordan-dashboard/QuotesTab";
import { FileAnalysisTab } from "@/components/admin/jordan-dashboard/FileAnalysisTab";
import { ReviewsTab } from "@/components/admin/jordan-dashboard/ReviewsTab";
import { EmailTrackingTab } from "@/components/admin/jordan-dashboard/EmailTrackingTab";
import { ToolsTab } from "@/components/admin/jordan-dashboard/ToolsTab";

const TABS = [
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "bg-green-500" },
  { id: "agentic", label: "Agentic AI", icon: Brain, color: "bg-orange-500" },
  { id: "wrapguru", label: "WrapGuru", icon: Car, color: "bg-purple-500" },
  { id: "corrections", label: "Corrections", icon: FileEdit, color: "bg-red-500" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, color: "bg-teal-500" },
  { id: "chats", label: "Chat Sessions", icon: MessageSquare, color: "bg-blue-500" },
  { id: "quotes", label: "Quotes", icon: FileText, color: "bg-indigo-500" },
  { id: "files", label: "File Analysis", icon: FolderSearch, color: "bg-pink-500" },
  { id: "reviews", label: "Reviews", icon: Star, color: "bg-yellow-500" },
  { id: "email", label: "Email Tracking", icon: Mail, color: "bg-cyan-500" },
  { id: "tools", label: "Tools", icon: Wrench, color: "bg-gray-500" },
];

export default function JordanLeeAdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Jordan Lee <span className="text-primary">Admin Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage Jordan's knowledge base and monitor chat sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">Trish@WePrintWraps.com</span>
            </span>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Colorful Tab Bar */}
          <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0 justify-start">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    data-[state=active]:text-white data-[state=active]:${tab.color}
                    data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
                    data-[state=inactive]:hover:bg-muted/80
                  `}
                  style={{
                    backgroundColor: activeTab === tab.id ? undefined : undefined,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="agentic" className="mt-6">
            <AgenticAITab />
          </TabsContent>

          <TabsContent value="wrapguru" className="mt-6">
            <WrapGuruTab />
          </TabsContent>

          <TabsContent value="corrections" className="mt-6">
            <CorrectionsTab />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBaseTab />
          </TabsContent>

          <TabsContent value="chats" className="mt-6">
            <ChatSessionsTab />
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            <QuotesTab />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <FileAnalysisTab />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewsTab />
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <EmailTrackingTab />
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <ToolsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
