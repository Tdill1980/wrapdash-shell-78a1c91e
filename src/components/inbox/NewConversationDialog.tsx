import { useState } from "react";
import { Mail, MessageSquare, User, Building2, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Contact } from "@/hooks/useInbox";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[] | undefined;
  onCreateContact: (contact: Partial<Contact>) => void;
  onCreateConversation: (data: { contactId: string; channel: string; subject?: string }) => void;
}

export const NewConversationDialog = ({
  open,
  onOpenChange,
  contacts,
  onCreateContact,
  onCreateConversation,
}: NewConversationDialogProps) => {
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [channel, setChannel] = useState<string>("email");
  const [subject, setSubject] = useState("");
  
  // New contact form
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");

  const handleStartConversation = () => {
    if (tab === "existing" && selectedContactId) {
      onCreateConversation({
        contactId: selectedContactId,
        channel,
        subject: subject || undefined,
      });
      onOpenChange(false);
      resetForm();
    }
  };

  const handleCreateAndStart = () => {
    if (newContactName) {
      // First create the contact, then the dialog will close
      // In a real implementation, you'd chain these with the returned contact ID
      onCreateContact({
        name: newContactName,
        email: newContactEmail || undefined,
        phone: newContactPhone || undefined,
        company: newContactCompany || undefined,
        source: "manual",
      });
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedContactId("");
    setChannel("email");
    setSubject("");
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactCompany("");
    setTab("existing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "existing" | "new")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Contact</TabsTrigger>
            <TabsTrigger value="new">New Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Contact</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{contact.name}</span>
                        {contact.email && (
                          <span className="text-muted-foreground text-xs">
                            ({contact.email})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      SMS
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
              />
            </div>

            <Button 
              onClick={handleStartConversation} 
              className="w-full"
              disabled={!selectedContactId}
            >
              Start Conversation
            </Button>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="John Smith"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Company</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newContactCompany}
                  onChange={(e) => setNewContactCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="pl-9"
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateAndStart} 
              className="w-full"
              disabled={!newContactName}
            >
              Create Contact
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
