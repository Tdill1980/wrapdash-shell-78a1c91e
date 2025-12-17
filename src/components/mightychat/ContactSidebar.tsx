import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  ExternalLink, 
  FileText,
  Calendar,
  Tag
} from "lucide-react";
import { TalkToAgentActions } from "./TalkToAgentActions";
import { formatDateAZ } from "@/lib/timezone";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  metadata: {
    instagram_sender_id?: string;
    username?: string;
    avatar_url?: string;
    profile_url?: string;
  } | null;
  created_at: string | null;
  last_contacted_at: string | null;
  tags: string[] | null;
}

interface ContactSidebarProps {
  contactId: string | null;
  channel: string;
  conversationId?: string;
  subject?: string;
}

export function ContactSidebar({ contactId, channel, conversationId, subject }: ContactSidebarProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contactId) {
      loadContact(contactId);
    } else {
      setContact(null);
    }
  }, [contactId]);

  const loadContact = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!error && data) {
      setContact(data as Contact);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string | null) => formatDateAZ(dateStr);

  const getChannelBadge = () => {
    const badges: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      instagram: { 
        icon: <Instagram className="w-3 h-3" />, 
        label: "Instagram DM",
        className: "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white border-0"
      },
      email: { 
        icon: <Mail className="w-3 h-3" />, 
        label: "Email",
        className: "bg-blue-500 text-white border-0"
      },
      sms: { 
        icon: <Phone className="w-3 h-3" />, 
        label: "SMS",
        className: "bg-green-500 text-white border-0"
      },
      website: { 
        icon: <User className="w-3 h-3" />, 
        label: "Website Chat",
        className: "bg-purple-500 text-white border-0"
      }
    };

    const badge = badges[channel] || badges.website;
    return (
      <Badge className={`${badge.className} flex items-center gap-1`}>
        {badge.icon}
        {badge.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (!contact) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <span className="text-muted-foreground text-sm text-center">
            Select a conversation to view contact details
          </span>
        </CardContent>
      </Card>
    );
  }

  const metadata = contact.metadata || {};
  const avatarUrl = metadata.avatar_url;
  const username = metadata.username;
  const profileUrl = metadata.profile_url;
  const initials = contact.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Contact Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-20 h-20 mb-3">
            <AvatarImage src={avatarUrl || undefined} alt={contact.name} />
            <AvatarFallback className="text-lg bg-gradient-to-br from-[#405DE6] to-[#E1306C] text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{contact.name}</h3>
          {username && (
            <a 
              href={profileUrl || `https://instagram.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              @{username}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <div className="mt-2">
            {getChannelBadge()}
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{contact.phone}</span>
            </div>
          )}
          {channel === "instagram" && profileUrl && (
            <div className="flex items-center gap-2 text-sm">
              <Instagram className="w-4 h-4 text-muted-foreground" />
              <a 
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                View Profile
              </a>
            </div>
          )}
        </div>

        <Separator />

        {/* Dates */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">First contact:</span>
            <span>{formatDate(contact.created_at)}</span>
          </div>
          {contact.last_contacted_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last contact:</span>
              <span>{formatDate(contact.last_contacted_at)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => window.location.href = `/mighty-customer?customer=${encodeURIComponent(contact.name)}&email=${encodeURIComponent(contact.email || '')}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Quote
          </Button>
        </div>

        {/* Talk to Agent Actions */}
        {conversationId && (
          <>
            <Separator />
            <TalkToAgentActions
              conversationId={conversationId}
              contactId={contactId}
              channel={channel}
              customerName={contact.name}
              subject={subject}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
