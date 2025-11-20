import { format } from "date-fns";
import { 
  Clock, 
  FileUp, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Box,
  Mail,
  Calendar,
  Send,
  MailOpen,
  MousePointerClick,
  MailX
} from "lucide-react";
import { ApproveFlowVersion, ApproveFlowAction, ApproveFlowChat, ApproveFlowEmailLog } from "@/hooks/useApproveFlow";

interface TimelineEvent {
  id: string;
  type: 'version' | 'action' | 'chat' | 'project_start' | 'file_missing' | 'email';
  timestamp: string;
  title: string;
  description?: string;
  icon: any;
  iconColor: string;
  data?: any;
}

interface ApproveFlowTimelineProps {
  projectCreatedAt: string;
  versions: ApproveFlowVersion[];
  actions: ApproveFlowAction[];
  chatMessages: ApproveFlowChat[];
  emailLogs: ApproveFlowEmailLog[];
  hasMissingFiles?: boolean;
}

export function ApproveFlowTimeline({ 
  projectCreatedAt, 
  versions, 
  actions, 
  chatMessages,
  emailLogs,
  hasMissingFiles 
}: ApproveFlowTimelineProps) {
  
  // Combine all events into a single timeline
  const allEvents: TimelineEvent[] = [];

  // Add project start
  allEvents.push({
    id: `start-${projectCreatedAt}`,
    type: 'project_start',
    timestamp: projectCreatedAt,
    title: 'Design Job Order Received',
    description: 'Project initiated',
    icon: Calendar,
    iconColor: 'text-blue-400',
  });

  // Add file missing indicator if applicable
  if (hasMissingFiles) {
    allEvents.push({
      id: `missing-${projectCreatedAt}`,
      type: 'file_missing',
      timestamp: projectCreatedAt,
      title: 'Missing Design Files',
      description: 'Awaiting customer artwork upload',
      icon: AlertCircle,
      iconColor: 'text-orange-400',
    });
  }

  // Add versions
  versions.forEach((version) => {
    allEvents.push({
      id: `version-${version.id}`,
      type: 'version',
      timestamp: version.created_at,
      title: `Version ${version.version_number} Uploaded`,
      description: version.notes || `${version.submitted_by === 'designer' ? 'Designer' : 'Customer'} uploaded design`,
      icon: FileUp,
      iconColor: version.submitted_by === 'designer' ? 'text-green-400' : 'text-purple-400',
      data: version,
    });
  });

  // Add actions
  actions.forEach((action) => {
    let title = '';
    let icon = Clock;
    let iconColor = 'text-gray-400';
    let description = '';

    switch (action.action_type) {
      case 'approved':
        title = 'Design Approved';
        description = 'Customer approved the design';
        icon = CheckCircle;
        iconColor = 'text-green-400';
        break;
      case 'revision_requested':
        title = 'Revision Requested';
        description = action.payload?.notes || 'Customer requested changes';
        icon = AlertCircle;
        iconColor = 'text-yellow-400';
        break;
      case 'proof_delivered':
        title = 'Proof Delivered';
        description = 'Design proof sent to customer';
        icon = Mail;
        iconColor = 'text-blue-400';
        break;
      case '3d_render_generated':
        title = '3D Render Generated';
        description = '3D visualization created';
        icon = Box;
        iconColor = 'text-cyan-400';
        break;
      default:
        title = action.action_type;
        icon = Clock;
        iconColor = 'text-gray-400';
    }

    allEvents.push({
      id: `action-${action.id}`,
      type: 'action',
      timestamp: action.created_at,
      title,
      description,
      icon,
      iconColor,
      data: action,
    });
  });

  // Add chat messages
  chatMessages.forEach((chat) => {
    allEvents.push({
      id: `chat-${chat.id}`,
      type: 'chat',
      timestamp: chat.created_at,
      title: `💬 ${chat.sender === 'designer' ? 'Designer' : 'Customer'} Message`,
      description: chat.message.substring(0, 100) + (chat.message.length > 100 ? '...' : ''),
      icon: MessageSquare,
      iconColor: chat.sender === 'designer' ? 'text-indigo-400' : 'text-pink-400',
      data: chat,
    });
  });

  // Add email logs
  emailLogs.forEach((email) => {
    let icon = Mail;
    let iconColor = 'text-blue-400';
    let statusText = '';

    // Determine icon and color based on status
    switch (email.status) {
      case 'sent':
      case 'delivered':
        icon = Send;
        iconColor = 'text-green-400';
        statusText = 'Sent';
        break;
      case 'opened':
        icon = MailOpen;
        iconColor = 'text-cyan-400';
        statusText = 'Opened';
        break;
      case 'clicked':
        icon = MousePointerClick;
        iconColor = 'text-purple-400';
        statusText = 'Clicked';
        break;
      case 'failed':
        icon = MailX;
        iconColor = 'text-red-400';
        statusText = 'Failed';
        break;
      case 'pending':
        icon = Clock;
        iconColor = 'text-yellow-400';
        statusText = 'Pending';
        break;
    }

    allEvents.push({
      id: `email-${email.id}`,
      type: 'email',
      timestamp: email.sent_at || email.created_at,
      title: `📧 Email ${statusText}: ${email.subject}`,
      description: `To: ${email.recipient_email} • ${email.provider.toUpperCase()}${email.error_message ? ` • Error: ${email.error_message}` : ''}`,
      icon,
      iconColor,
      data: email,
    });
  });

  // Sort all events by timestamp (newest first)
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <h2 className="text-[24px] font-bold font-poppins text-white mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-blue-400" />
        Project Timeline
        <span className="text-sm font-normal text-white/40 ml-2">Source of Truth</span>
      </h2>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
        {allEvents.map((event, index) => {
          const Icon = event.icon;
          return (
            <div 
              key={event.id}
              className="flex gap-4 pb-4 border-b border-white/5 last:border-0"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ${event.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-white/60 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-white/40 whitespace-nowrap">
                    {format(new Date(event.timestamp), 'MMM d, yyyy')}
                    <br />
                    {format(new Date(event.timestamp), 'h:mm a')}
                  </time>
                </div>

                {/* Show approval deadline if it's a proof delivery */}
                {event.type === 'action' && event.data?.action_type === 'proof_delivered' && event.data?.payload?.deadline && (
                  <div className="mt-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-xs text-orange-400">
                      Approval Deadline: {format(new Date(event.data.payload.deadline), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}

                {/* Show email delivery details */}
                {event.type === 'email' && event.data && (
                  <div className="mt-2 space-y-1">
                    {event.data.delivered_at && (
                      <p className="text-xs text-green-400">
                        ✓ Delivered: {format(new Date(event.data.delivered_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                    {event.data.opened_at && (
                      <p className="text-xs text-cyan-400">
                        ✓ Opened: {format(new Date(event.data.opened_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                    {event.data.clicked_at && (
                      <p className="text-xs text-purple-400">
                        ✓ Clicked: {format(new Date(event.data.clicked_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                )}

                {/* Show full chat message on hover/expand */}
                {event.type === 'chat' && event.data && event.data.message.length > 100 && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                      Show full message
                    </summary>
                    <p className="text-xs text-white/80 mt-2 p-2 bg-white/5 rounded">
                      {event.data.message}
                    </p>
                  </details>
                )}
              </div>
            </div>
          );
        })}

        {allEvents.length === 0 && (
          <p className="text-center text-white/40 py-8">No timeline events yet</p>
        )}
      </div>
    </div>
  );
}
