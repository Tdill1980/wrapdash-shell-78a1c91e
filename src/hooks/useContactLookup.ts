import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContactData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  last_quote_at: string | null;
  last_quote_amount: number | null;
}

export function useContactLookup() {
  const [isLooking, setIsLooking] = useState(false);
  const [foundContact, setFoundContact] = useState<ContactData | null>(null);
  const { toast } = useToast();

  const lookupContact = useCallback(async (query: {
    email?: string;
    phone?: string;
    company?: string;
  }): Promise<ContactData | null> => {
    if (!query.email && !query.phone && !query.company) {
      return null;
    }

    setIsLooking(true);
    try {
      // Build OR query for any match
      let queryBuilder = supabase
        .from("contacts")
        .select("id, name, email, phone, company, source, tags, metadata, last_quote_at, last_quote_amount");

      // Try each field in priority order
      if (query.email && query.email.trim()) {
        const { data: emailMatch } = await queryBuilder
          .ilike("email", query.email.trim())
          .limit(1)
          .maybeSingle();
        
        if (emailMatch) {
          const contact = emailMatch as ContactData;
          setFoundContact(contact);
          toast({
            title: "Customer Found!",
            description: `Autofilled from existing customer: ${contact.name}`,
          });
          return contact;
        }
      }

      if (query.phone && query.phone.trim()) {
        const cleanPhone = query.phone.replace(/\D/g, "");
        if (cleanPhone.length >= 10) {
          const { data: phoneMatch } = await supabase
            .from("contacts")
            .select("id, name, email, phone, company, source, tags, metadata, last_quote_at, last_quote_amount")
            .or(`phone.ilike.%${cleanPhone.slice(-10)}%`)
            .limit(1)
            .maybeSingle();
          
          if (phoneMatch) {
            const contact = phoneMatch as ContactData;
            setFoundContact(contact);
            toast({
              title: "Customer Found!",
              description: `Autofilled from phone: ${contact.name}`,
            });
            return contact;
          }
        }
      }

      if (query.company && query.company.trim()) {
        const { data: companyMatch } = await supabase
          .from("contacts")
          .select("id, name, email, phone, company, source, tags, metadata, last_quote_at, last_quote_amount")
          .ilike("company", `%${query.company.trim()}%`)
          .limit(1)
          .maybeSingle();
        
        if (companyMatch) {
          const contact = companyMatch as ContactData;
          setFoundContact(contact);
          toast({
            title: "Shop Found!",
            description: `Autofilled from shop name: ${contact.company}`,
          });
          return contact;
        }
      }

      setFoundContact(null);
      return null;
    } catch (error) {
      console.error("Contact lookup error:", error);
      return null;
    } finally {
      setIsLooking(false);
    }
  }, [toast]);

  const clearContact = useCallback(() => {
    setFoundContact(null);
  }, []);

  return {
    lookupContact,
    clearContact,
    foundContact,
    isLooking,
  };
}
