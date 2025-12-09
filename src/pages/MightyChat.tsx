import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MessageCircle, Phone, Send, ArrowLeft } from "lucide-react";

interface Conversation {
  id: string;
  channel: string;
  subject: string | null;
  status: string | null;
  priority: string | null;
  unread_count: number | null;
  last_message_at: string | null;
  contact_id: string | null;
}

interface Message {
  id: string;
  content: string;
  direction: string;
  channel: string;
  created_at: string | null;
  sender_name: string | null;
}

export default function MightyChat() {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("id");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadConversation(selectedId);
    }
  }, [selectedId, conversations]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false });
    
    if (!error && data) {
      setConversations(data);
    }
    setLoading(false);
  };

  const loadConversation = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setSelectedConversation(conv);
      
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      
      if (msgs) {
        setMessages(msgs);
      }
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="w-4 h-4" />;
      case "instagram": return <MessageCircle className="w-4 h-4 text-pink-500" />;
      case "sms": return <Phone className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      default: return "bg-muted";
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Mighty<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>™
          </h1>
          <p className="text-muted-foreground">Unified Inbox: DM, Email, SMS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {loading ? (
                  <div className="p-4 text-muted-foreground">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-muted-foreground">No conversations yet</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv);
                        loadConversation(conv.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {getChannelIcon(conv.channel)}
                        <span className="font-medium flex-1 truncate">
                          {conv.subject || `${conv.channel} conversation`}
                        </span>
                        {(conv.unread_count ?? 0) > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.last_message_at)}
                        </span>
                        {conv.priority && conv.priority !== "normal" && (
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(conv.priority)}`} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    {getChannelIcon(selectedConversation.channel)}
                    <CardTitle className="text-lg">
                      {selectedConversation.subject || `${selectedConversation.channel} conversation`}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-350px)]">
                  <ScrollArea className="flex-1 p-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 ${
                          msg.direction === "outbound" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.sender_name && (
                            <div className="text-xs opacity-70 mb-1">
                              {msg.sender_name}
                            </div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  
                  {/* Reply Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newMessage.trim()) {
                            // TODO: Send message
                          }
                        }}
                      />
                      <Button size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
