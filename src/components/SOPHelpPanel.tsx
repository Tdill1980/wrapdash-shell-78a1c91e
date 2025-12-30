import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, MessageSquare, ListTodo, Bot, Film, Calendar, CheckCircle, Download, Send, Mail, AlertTriangle, ArrowUpRight, Forward, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function SOPHelpPanel() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg bg-amber-500 text-white hover:bg-amber-600 border-0 lg:left-[calc(16rem+1.5rem)]"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden">
        <SheetHeader>
          <SheetTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            WrapCommand SOP Guide
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Complete guide to using WrapCommand AI tools
          </p>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <Accordion type="single" collapsible className="w-full space-y-2">
            
            {/* MightyChat SOP */}
            <AccordionItem value="mightychat" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>MightyChat</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">What is MightyChat?</h4>
                  <p className="text-muted-foreground">
                    MightyChat is your unified inbox for all customer communications across email, Instagram, Facebook, and web chat.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Action Buttons Explained</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Forward className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div>
                        <span className="font-medium">Forward to Lance</span>
                        <p className="text-muted-foreground text-xs">Instantly emails lance@weprintwraps.com with conversation + attachments</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ListTodo className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Backlog</span>
                        <p className="text-muted-foreground text-xs">Creates task + sends email notification to Lance or Jackson</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                      <div>
                        <span className="font-medium">Flag CX Risk</span>
                        <p className="text-muted-foreground text-xs">URGENT: Emails Jackson immediately, marks conversation as high priority</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowUpRight className="w-4 h-4 text-orange-400 mt-0.5" />
                      <div>
                        <span className="font-medium">Escalate</span>
                        <p className="text-muted-foreground text-xs">Creates urgent escalation + sends email to Lance or Jackson</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Replying to Customers</h4>
                  <p className="text-muted-foreground">
                    Use the "Type a message..." input box at the bottom of the conversation to reply directly. Your reply will be sent via the same channel (email, Instagram, etc.).
                  </p>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/mightychat" 
                    onClick={() => setOpen(false)}
                    className="text-primary hover:underline text-xs"
                  >
                    Go to MightyChat →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Backlog & Escalations SOP */}
            <AccordionItem value="backlog" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-green-500" />
                  <span>Backlog & Escalations</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Where to View</h4>
                  <p className="text-muted-foreground">
                    Go to <Link to="/backlog" onClick={() => setOpen(false)} className="text-primary hover:underline">/backlog</Link> to see all tasks, escalations, and CX risks.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Filter Tabs</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Badge variant="secondary">All</Badge> - All pending items</li>
                    <li><Badge variant="destructive">Escalations</Badge> - Urgent escalations and CX risks</li>
                    <li><Badge variant="secondary">Lance</Badge> - Items assigned to Lance</li>
                    <li><Badge variant="secondary">Jackson</Badge> - Items assigned to Jackson</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Email Notifications</h4>
                  <p className="text-muted-foreground">
                    When you create a backlog item or escalation from MightyChat, the assigned person automatically receives an email with:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Customer name & email</li>
                    <li>Message excerpt</li>
                    <li>Link to conversation</li>
                    <li>Any attachments</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Marking Items Resolved</h4>
                  <p className="text-muted-foreground">
                    Click the green "Resolved" button on any item once you've handled it. This updates the record and moves it to the resolved section.
                  </p>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/backlog" 
                    onClick={() => setOpen(false)}
                    className="text-primary hover:underline text-xs"
                  >
                    Go to Backlog →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Jordan Website Agent SOP */}
            <AccordionItem value="jordan" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span>Jordan (Website Chat Agent)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">What Jordan Does</h4>
                  <p className="text-muted-foreground">
                    Jordan is the AI that handles live chat on weprintwraps.com and restyleprofilm.com. Jordan automatically:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Answers product questions</li>
                    <li>Provides bulk pricing quotes</li>
                    <li>Promotes WrapRewards program to first-time buyers</li>
                    <li>Offers WRAPREWARDS promo code for 10% off</li>
                    <li>Mentions Ink & Edge Magazine Issue 1</li>
                    <li>Collects email for bulk orders</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Bulk Pricing Tiers</h4>
                  <p className="text-muted-foreground text-xs">
                    5-9 rolls: 10% off | 10-24: 15% | 25-49: 20% | 50-99: 25% | 100+: 30%+ custom
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">When Jordan Escalates</h4>
                  <p className="text-muted-foreground">
                    Jordan escalates to humans when:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Customer expresses frustration</li>
                    <li>Complex custom design requests</li>
                    <li>Payment or order issues</li>
                    <li>Requests to speak to a human</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">View Jordan's Logs</h4>
                  <p className="text-muted-foreground">
                    See all of Jordan's conversations at <Link to="/admin/website-agent" onClick={() => setOpen(false)} className="text-primary hover:underline">/admin/website-agent</Link> (Ops Desk)
                  </p>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/admin/website-agent" 
                    onClick={() => setOpen(false)}
                    className="text-primary hover:underline text-xs"
                  >
                    Go to Ops Desk →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* AI Agents Directory */}
            <AccordionItem value="agents" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span>AI Agents Directory</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="grid gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Jordan</Badge>
                      <span className="text-xs text-muted-foreground">Website Chat</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Live chat on weprintwraps.com, handles product questions, bulk pricing, WrapRewards</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Alex</Badge>
                      <span className="text-xs text-muted-foreground">Sales</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Generates quotes, follow-up emails, lead qualification</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Grant</Badge>
                      <span className="text-xs text-muted-foreground">Design Review</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Reviews customer designs, provides feedback, ApproveFlow management</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Emily</Badge>
                      <span className="text-xs text-muted-foreground">Email Content</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Creates email campaigns, newsletters, promotional content</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Noah</Badge>
                      <span className="text-xs text-muted-foreground">Social Content</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Instagram/Facebook posts, captions, hashtags, short-form content</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Ryan</Badge>
                      <span className="text-xs text-muted-foreground">Long-form Content</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Blog posts, articles, educational content, SEO content</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Casey</Badge>
                      <span className="text-xs text-muted-foreground">Social Media</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Community management, DM responses, engagement</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Evan</Badge>
                      <span className="text-xs text-muted-foreground">Affiliate/Sponsorship</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Affiliate outreach, sponsorship management, creator relations</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Content Creation SOP */}
            <AccordionItem value="content-create" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-pink-500" />
                  <span>Content Creation</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Creating Content</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to <Link to="/contentbox" onClick={() => setOpen(false)} className="text-primary hover:underline">ContentBox AI</Link></li>
                    <li>Select agent: Emily (email), Noah (social), Ryan (long-form)</li>
                    <li>Enter your prompt describing what you want</li>
                    <li>Review and refine the AI's output</li>
                    <li>Click "Save as Draft" or "Send for Approval"</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Best Practices</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Be specific in your prompts</li>
                    <li>Include brand, product, and target audience</li>
                    <li>Specify tone: educational, promotional, fun</li>
                    <li>Request specific hashtags or CTA if needed</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/contentbox" 
                    onClick={() => setOpen(false)}
                    className="text-primary hover:underline text-xs"
                  >
                    Go to ContentBox AI →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Content Approval SOP */}
            <AccordionItem value="content-approve" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Content Approval</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Where to Review</h4>
                  <p className="text-muted-foreground">
                    All AI-generated content appears in <Link to="/content-drafts" onClick={() => setOpen(false)} className="text-primary hover:underline">Content Drafts</Link>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Review Actions</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Badge className="bg-green-600">Approve</Badge> - Content is ready, move to scheduling</li>
                    <li><Badge variant="destructive">Reject</Badge> - Content needs major changes, provide feedback</li>
                    <li><Badge variant="secondary">Regenerate</Badge> - Ask AI to create a new version</li>
                    <li><Badge variant="outline">Edit</Badge> - Make manual adjustments</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Downloading Content
                  </h4>
                  <p className="text-muted-foreground">
                    Click the download icon on any approved content to save images or copy text. Videos can be downloaded from the expanded view.
                  </p>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/content-drafts" 
                    onClick={() => setOpen(false)}
                    className="text-primary hover:underline text-xs"
                  >
                    Go to Content Drafts →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Content Scheduling & Deployment SOP */}
            <AccordionItem value="content-schedule" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Content Scheduling & Deployment</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Content Calendar</h4>
                  <p className="text-muted-foreground">
                    Go to <Link to="/content-calendar" onClick={() => setOpen(false)} className="text-primary hover:underline">Content Calendar</Link> to view and schedule all content.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Scheduling Steps</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>From Content Drafts, click "Schedule" on approved content</li>
                    <li>Select date and time</li>
                    <li>Choose platform (Instagram, Facebook, etc.)</li>
                    <li>Confirm scheduling</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Status Tracking</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Badge variant="secondary">Draft</Badge> - Still being created/reviewed</li>
                    <li><Badge variant="outline">Scheduled</Badge> - Queued for future publication</li>
                    <li><Badge className="bg-green-600">Published</Badge> - Live on platform</li>
                    <li><Badge variant="destructive">Failed</Badge> - Publishing error, needs attention</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Publishing
                  </h4>
                  <p className="text-muted-foreground">
                    Content publishes automatically at scheduled time, or click "Publish Now" for immediate posting. Instagram requires connected account.
                  </p>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/content-calendar" 
                    onClick={() => setOpen(false)}
                    className="text-primary hover:underline text-xs"
                  >
                    Go to Content Calendar →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Quick Reference */}
            <AccordionItem value="quick-ref" className="border rounded-lg px-4 bg-muted/30">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>Quick Reference</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="grid gap-2">
                  <Link 
                    to="/mightychat" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>MightyChat</span>
                    <span className="text-xs text-muted-foreground ml-auto">Customer inbox</span>
                  </Link>
                  
                  <Link 
                    to="/backlog" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ListTodo className="w-4 h-4 text-green-500" />
                    <span>Backlog</span>
                    <span className="text-xs text-muted-foreground ml-auto">Tasks & escalations</span>
                  </Link>
                  
                  <Link 
                    to="/admin/website-agent" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Bot className="w-4 h-4 text-purple-500" />
                    <span>Ops Desk</span>
                    <span className="text-xs text-muted-foreground ml-auto">Jordan's chat logs</span>
                  </Link>
                  
                  <Link 
                    to="/contentbox" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Film className="w-4 h-4 text-pink-500" />
                    <span>ContentBox AI</span>
                    <span className="text-xs text-muted-foreground ml-auto">Create content</span>
                  </Link>
                  
                  <Link 
                    to="/content-drafts" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Content Drafts</span>
                    <span className="text-xs text-muted-foreground ml-auto">Review & approve</span>
                  </Link>
                  
                  <Link 
                    to="/content-calendar" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>Content Calendar</span>
                    <span className="text-xs text-muted-foreground ml-auto">Schedule & publish</span>
                  </Link>

                  <Link 
                    to="/mightytask" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-cyan-500" />
                    <span>MightyTask</span>
                    <span className="text-xs text-muted-foreground ml-auto">Task management</span>
                  </Link>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2 text-xs uppercase text-muted-foreground">Team Emails</h4>
                  <div className="space-y-1 text-xs">
                    <p><Mail className="w-3 h-3 inline mr-1" />Lance: lance@weprintwraps.com</p>
                    <p><Mail className="w-3 h-3 inline mr-1" />Jackson: jackson@weprintwraps.com</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
