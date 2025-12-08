import { Mail, Phone, Building2, Tag, Calendar, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import type { Contact, Conversation } from "@/hooks/useInbox";
import { ChatDesignActions } from "@/components/mightychat/ChatDesignActions";

interface ContactPanelProps {
  contact: Contact | undefined;
  conversation: Conversation | undefined;
}

export const ContactPanel = ({ contact, conversation }: ContactPanelProps) => {
  if (!contact) {
    return (
      <div className="w-80 border-l border-border bg-card/30 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a conversation</p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-500/20 text-red-400",
    high: "bg-orange-500/20 text-orange-400",
    normal: "bg-muted text-muted-foreground",
    low: "bg-muted/50 text-muted-foreground",
  };

  return (
    <ScrollArea className="w-80 border-l border-border bg-card/30">
      <div className="p-4">
        {/* Contact Header */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-medium mx-auto mb-3">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-semibold text-lg">{contact.name}</h3>
          {contact.company && (
            <p className="text-sm text-muted-foreground">{contact.company}</p>
          )}
          <Badge 
            variant="outline" 
            className={`mt-2 ${priorityColors[contact.priority]}`}
          >
            {contact.priority} priority
          </Badge>
        </div>

        <Separator className="my-4" />

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Contact Info
          </h4>
          
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`mailto:${contact.email}`} 
                className="text-sm text-primary hover:underline truncate"
              >
                {contact.email}
              </a>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`tel:${contact.phone}`} 
                className="text-sm text-primary hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          )}
          
          {contact.company && (
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contact.company}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Activity
          </h4>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Created: </span>
              {format(new Date(contact.created_at), "MMM d, yyyy")}
            </div>
          </div>
          
          {contact.last_contacted_at && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="text-muted-foreground">Last contact: </span>
                {format(new Date(contact.last_contacted_at), "MMM d, yyyy")}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Source: </span>
              {contact.source}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* AI Design Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            AI Design Tools
          </h4>
          <ChatDesignActions
            contactId={contact.id}
            contactName={contact.name}
            contactEmail={contact.email || undefined}
            lastVehicle={(contact.metadata as any)?.last_vehicle}
          />
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h4>
          
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <ExternalLink className="w-4 h-4" />
            View Quotes
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <ExternalLink className="w-4 h-4" />
            View Orders
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <ExternalLink className="w-4 h-4" />
            Create Task
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};
