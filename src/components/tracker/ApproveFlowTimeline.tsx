import { format } from "date-fns";
import { 
  Clock, 
  FileUp, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Box,
  Mail,
  Calendar
} from "lucide-react";
import { ApproveFlowVersion, ApproveFlowAction, ApproveFlowChat } from "@/hooks/useApproveFlow";

interface TimelineEvent {
  id: string;
  type: 'version' | 'action' | 'chat' | 'project_start' | 'file_missing';
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
  hasMissingFiles?: boolean;
}

export function ApproveFlowTimeline({ 
  projectCreatedAt, 
  versions, 
  actions, 
  chatMessages,
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

  // Add chat messages (only significant ones)
  chatMessages.forEach((chat) => {
    allEvents.push({
      id: `chat-${chat.id}`,
      type: 'chat',
      timestamp: chat.created_at,
      title: `${chat.sender === 'designer' ? 'Designer' : 'Customer'} Message`,
      description: chat.message.substring(0, 100) + (chat.message.length > 100 ? '...' : ''),
      icon: MessageSquare,
      iconColor: chat.sender === 'designer' ? 'text-indigo-400' : 'text-pink-400',
      data: chat,
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
