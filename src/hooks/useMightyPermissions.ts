import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AgentInbox } from "@/components/mightychat/AgentInboxTabs";

type UserRole = 'admin' | 'orchestrator' | 'designer' | 'agent';

interface MightyPermissions {
  role: UserRole;
  userId: string | null;
  displayName: string;
  allowedInboxes: AgentInbox[];
  canReplyExternal: (inbox: AgentInbox) => boolean;
  canAccessOpsDesk: boolean;
  canApproveOps: boolean;
  loading: boolean;
}

// Role definitions based on spec
const ROLE_PERMISSIONS: Record<UserRole, {
  allowedInboxes: AgentInbox[];
  canReplyExternal: AgentInbox[];
  canAccessOpsDesk: boolean;
  canApproveOps: boolean;
}> = {
  admin: {
    allowedInboxes: ['website', 'hello', 'design', 'dms', 'ops_desk'],
    canReplyExternal: ['website', 'hello', 'design', 'dms'],
    canAccessOpsDesk: true,
    canApproveOps: true
  },
  orchestrator: {
    allowedInboxes: ['website', 'hello', 'design', 'dms', 'ops_desk'],
    canReplyExternal: ['website', 'hello', 'design', 'dms'],
    canAccessOpsDesk: true,
    canApproveOps: true
  },
  designer: {
    // Manny's permissions - design only, read-only external
    allowedInboxes: ['design'],
    canReplyExternal: [], // Cannot reply to external threads
    canAccessOpsDesk: false,
    canApproveOps: false
  },
  agent: {
    // Grant's permissions - design + website, can reply external in design
    allowedInboxes: ['website', 'design'],
    canReplyExternal: ['design'],
    canAccessOpsDesk: true,
    canApproveOps: false
  }
};

// Map email/user to role - in production this would come from database
const USER_ROLE_MAP: Record<string, UserRole> = {
  'trish@weprintwraps.com': 'admin',
  'jackson@weprintwraps.com': 'orchestrator',
  'manny@weprintwraps.com': 'designer',
  'grant@weprintwraps.com': 'agent',
  'alex@weprintwraps.com': 'agent',
  'lance@weprintwraps.com': 'designer'
};

export function useMightyPermissions(): MightyPermissions {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      setUserId(user?.id || null);
      setLoading(false);
    };
    
    getUser();
  }, []);

  const role = useMemo((): UserRole => {
    if (!userEmail) return 'orchestrator'; // Default to orchestrator for demo
    return USER_ROLE_MAP[userEmail.toLowerCase()] || 'orchestrator';
  }, [userEmail]);

  const permissions = ROLE_PERMISSIONS[role];

  const displayName = useMemo(() => {
    if (!userEmail) return 'User';
    const name = userEmail.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [userEmail]);

  return {
    role,
    userId,
    displayName,
    allowedInboxes: permissions.allowedInboxes,
    canReplyExternal: (inbox: AgentInbox) => permissions.canReplyExternal.includes(inbox),
    canAccessOpsDesk: permissions.canAccessOpsDesk,
    canApproveOps: permissions.canApproveOps,
    loading
  };
}

// Helper to determine if a conversation is external
export function isExternalConversation(channel: string, direction?: string): boolean {
  // All customer-initiated conversations are external
  return channel !== 'internal' && direction !== 'internal';
}

// Helper to get the handler name for a given inbox
export function getExternalHandler(inbox: AgentInbox): string {
  switch (inbox) {
    case 'design':
      return 'Grant via ApproveFlow';
    case 'hello':
      return 'Alex';
    case 'website':
      return 'Jordan';
    case 'dms':
      return 'Casey';
    default:
      return 'Ops Desk';
  }
}
