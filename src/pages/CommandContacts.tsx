import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Users, Mail, Phone, MapPin, Car, FileText, 
  Send, Plus, Filter, Download, RefreshCw, Building2,
  Clock, MessageSquare, DollarSign, Tag, Flame, Snowflake
} from "lucide-react";
import { format } from "date-fns";

interface CommandContact {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  shop_name: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  last_vehicle_interest: string | null;
  has_received_quote: boolean;
  has_ordered: boolean;
  conversation_count: number;
  lead_score: number;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  last_conversation_at: string | null;
}

function ContactCard({ contact, onClick }: { contact: CommandContact; onClick: () => void }) {
  const isHot = contact.conversation_count > 2 || contact.has_received_quote;
  const hasPhone = !!contact.phone;
  const hasShop = !!contact.shop_name;
  
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {contact.name || contact.email.split('@')[0]}
            </span>
            {isHot && (
              <Badge variant="destructive" className="text-xs">
                <Flame className="h-3 w-3 mr-1" />
                Hot
              </Badge>
            )}
            {contact.has_received_quote && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                Quoted
              </Badge>
            )}
            {contact.has_ordered && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">
                Customer
              </Badge>
            )}
          </div>
          
          {/* Email */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{contact.email}</span>
          </div>
          
          {/* Phone */}
          {hasPhone && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          )}
          
          {/* Shop Name */}
          {hasShop && (
            <div className="flex items-center gap-1 text-sm text-primary">
              <Building2 className="h-3 w-3" />
              <span>{contact.shop_name}</span>
            </div>
          )}
          
          {/* Location */}
          {contact.city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{contact.city}{contact.region ? `, ${contact.region}` : ''}</span>
            </div>
          )}
          
          {/* Vehicle Interest */}
          {contact.last_vehicle_interest && (
            <div className="flex items-center gap-1 text-sm text-orange-500">
              <Car className="h-3 w-3" />
              <span className="truncate">
                {typeof contact.last_vehicle_interest === 'string' 
                  ? (() => {
                      try {
                        const v = JSON.parse(contact.last_vehicle_interest);
                        return `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() || contact.last_vehicle_interest;
                      } catch {
                        return contact.last_vehicle_interest;
                      }
                    })()
                  : 'Vehicle interest'
                }
              </span>
            </div>
          )}
        </div>
        
        {/* Right side stats */}
        <div className="text-right text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-end gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{contact.conversation_count} chats</span>
          </div>
          <div>{contact.source}</div>
          {contact.last_conversation_at && (
            <div className="text-xs">
              {format(new Date(contact.last_conversation_at), 'M/d/yy')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ContactDetailModal({ 
  contact, 
  open, 
  onClose 
}: { 
  contact: CommandContact | null; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!contact) return null;
  
  const vehicleDisplay = contact.last_vehicle_interest 
    ? (() => {
        try {
          const v = JSON.parse(contact.last_vehicle_interest);
          return `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim();
        } catch {
          return contact.last_vehicle_interest;
        }
      })()
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {contact.name || contact.email}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="default">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
            {contact.phone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline">
              <Tag className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </div>
          
          {/* Contact Info */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Contact Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{contact.email}</div>
              </div>
              {contact.phone && (
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="font-medium">{contact.phone}</div>
                </div>
              )}
              {contact.shop_name && (
                <div>
                  <div className="text-xs text-muted-foreground">Shop/Company</div>
                  <div className="font-medium">{contact.shop_name}</div>
                </div>
              )}
              {contact.city && (
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {contact.city}{contact.region ? `, ${contact.region}` : ''}
                    {contact.country ? ` (${contact.country})` : ''}
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Vehicle Interest */}
          {vehicleDisplay && (
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Interest
              </h3>
              <div className="font-medium text-orange-500">{vehicleDisplay}</div>
            </Card>
          )}
          
          {/* Stats */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Engagement</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{contact.conversation_count}</div>
                <div className="text-xs text-muted-foreground">Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{contact.has_received_quote ? 'Yes' : 'No'}</div>
                <div className="text-xs text-muted-foreground">Quoted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{contact.has_ordered ? 'Yes' : 'No'}</div>
                <div className="text-xs text-muted-foreground">Ordered</div>
              </div>
            </div>
          </Card>
          
          {/* MightyMail Integration */}
          <Card className="p-4 space-y-3 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <h3 className="font-semibold text-sm uppercase flex items-center gap-2">
              <Send className="h-4 w-4" />
              MightyMail
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary">
                Enroll in Sequence
              </Button>
              <Button size="sm" variant="outline">
                View Email History
              </Button>
            </div>
          </Card>
          
          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Source: {contact.source}</div>
            <div>Created: {format(new Date(contact.created_at), 'MMM d, yyyy h:mm a')}</div>
            {contact.last_conversation_at && (
              <div>Last Activity: {format(new Date(contact.last_conversation_at), 'MMM d, yyyy h:mm a')}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CommandContacts() {
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<CommandContact | null>(null);
  const [filter, setFilter] = useState<'all' | 'hot' | 'quoted' | 'customers'>('all');
  
  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ['command-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('command_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CommandContact[];
    }
  });
  
  // Filter contacts
  const filteredContacts = contacts?.filter(c => {
    // Search filter
    const matchesSearch = !search || 
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const isHot = c.conversation_count > 2 || c.has_received_quote;
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'hot' && isHot) ||
      (filter === 'quoted' && c.has_received_quote) ||
      (filter === 'customers' && c.has_ordered);
    
    return matchesSearch && matchesFilter;
  }) || [];
  
  // Stats
  const totalContacts = contacts?.length || 0;
  const hotLeads = contacts?.filter(c => c.conversation_count > 2 || c.has_received_quote).length || 0;
  const quoted = contacts?.filter(c => c.has_received_quote).length || 0;
  const customers = contacts?.filter(c => c.has_ordered).length || 0;
  
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              CommandContacts
            </h1>
            <p className="text-muted-foreground">
              Your unified CRM • Powers MightyMail
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card 
            className={`p-4 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalContacts}</div>
                <div className="text-sm text-muted-foreground">Total Contacts</div>
              </div>
            </div>
          </Card>
          <Card 
            className={`p-4 cursor-pointer transition-all ${filter === 'hot' ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => setFilter('hot')}
          >
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{hotLeads}</div>
                <div className="text-sm text-muted-foreground">Hot Leads</div>
              </div>
            </div>
          </Card>
          <Card 
            className={`p-4 cursor-pointer transition-all ${filter === 'quoted' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFilter('quoted')}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{quoted}</div>
                <div className="text-sm text-muted-foreground">Quoted</div>
              </div>
            </div>
          </Card>
          <Card 
            className={`p-4 cursor-pointer transition-all ${filter === 'customers' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFilter('customers')}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{customers}</div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, shop, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Contact List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No contacts found</div>
          ) : (
            filteredContacts.map((contact) => (
              <ContactCard 
                key={contact.id} 
                contact={contact} 
                onClick={() => setSelectedContact(contact)}
              />
            ))
          )}
        </div>
        
        {/* Showing count */}
        {!isLoading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredContacts.length} of {totalContacts} contacts
          </div>
        )}
        
        {/* Contact Detail Modal */}
        <ContactDetailModal
          contact={selectedContact}
          open={!!selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      </div>
    </MainLayout>
  );
}
