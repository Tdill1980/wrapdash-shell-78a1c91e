import { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { MightyTaskWorkspace } from '@/components/mightytask/MightyTaskWorkspace';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, DollarSign, Newspaper, Video } from 'lucide-react';

type ChannelKey = 'ink_edge_publisher' | 'wpw' | 'wraptvworld' | 'ink_edge_content';

interface ChannelConfig {
  key: ChannelKey;
  slug: string;
  name: string;
  icon: React.ElementType;
  emoji: string;
  description: string;
  checklist: { id: string; label: string; completed: boolean }[];
  gradientFrom: string;
  gradientTo: string;
}

// 4 unified channel buttons in order: Publisher (flywheel) → WPW → WrapTV → Content
const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    key: 'ink_edge_publisher',
    slug: 'ink_edge_publisher',
    name: 'Ink & Edge Publisher',
    icon: BookOpen,
    emoji: '📕',
    description: 'Source content flywheel — creates the magazine',
    gradientFrom: '#4f46e5',
    gradientTo: '#6366f1',
    checklist: [
      { id: '1', label: 'Article intake complete', completed: false },
      { id: '2', label: 'Editorial review done', completed: false },
      { id: '3', label: 'Design/layout approved', completed: false },
      { id: '4', label: 'Published to magazine', completed: false },
      { id: '5', label: 'Distribution assets prepared', completed: false },
    ],
  },
  {
    key: 'wpw',
    slug: 'wpw',
    name: 'WePrintWraps.com',
    icon: DollarSign,
    emoji: '💰',
    description: 'Revenue-driving campaigns & promotions',
    gradientFrom: '#dc2626',
    gradientTo: '#ef4444',
    checklist: [
      { id: '1', label: 'Source content linked', completed: false },
      { id: '2', label: 'Campaign copy written', completed: false },
      { id: '3', label: 'Email template designed', completed: false },
      { id: '4', label: 'Segment selected', completed: false },
      { id: '5', label: 'Scheduled in Klaviyo', completed: false },
      { id: '6', label: 'Luigi ordering line added', completed: false },
    ],
  },
  {
    key: 'wraptvworld',
    slug: 'wraptvworld',
    name: 'WrapTVWorld',
    icon: Video,
    emoji: '🎥',
    description: 'Monthly video proof & YouTube content',
    gradientFrom: '#7c3aed',
    gradientTo: '#a855f7',
    checklist: [
      { id: '1', label: 'Source article linked', completed: false },
      { id: '2', label: 'Video script written', completed: false },
      { id: '3', label: 'Video recorded', completed: false },
      { id: '4', label: 'Video edited', completed: false },
      { id: '5', label: 'Published to YouTube', completed: false },
      { id: '6', label: 'Social teaser posted', completed: false },
    ],
  },
  {
    key: 'ink_edge_content',
    slug: 'ink_edge_content',
    name: 'Ink & Edge Content',
    icon: Newspaper,
    emoji: '📰',
    description: 'Editorial distribution — emails, social, articles',
    gradientFrom: '#ec4899',
    gradientTo: '#f472b6',
    checklist: [
      { id: '1', label: 'Source content linked', completed: false },
      { id: '2', label: 'Article page published', completed: false },
      { id: '3', label: 'Editorial email sent', completed: false },
      { id: '4', label: 'IG post created', completed: false },
      { id: '5', label: 'FB post created', completed: false },
      { id: '6', label: 'Story posted', completed: false },
    ],
  },
];

const ACTION_BUTTONS_MAP: Record<ChannelKey, { label: string; agent: string }[]> = {
  ink_edge_publisher: [
    { label: 'Generate Magazine Outline', agent: 'ryan_mitchell' },
    { label: 'Edit Article', agent: 'ryan_mitchell' },
    { label: 'Prepare Distribution Assets', agent: 'ryan_mitchell' },
  ],
  wpw: [
    { label: 'Create WPW Email Campaign', agent: 'emily_carter' },
    { label: 'Adapt Article for WPW', agent: 'emily_carter' },
    { label: 'Add Luigi Ordering Line', agent: 'jordan_lee' },
  ],
  wraptvworld: [
    { label: 'Create Video Script', agent: 'wraptvworld_producer' },
    { label: 'Edit Video Outline', agent: 'wraptvworld_producer' },
    { label: 'Create Social Teaser', agent: 'noah_bennett' },
  ],
  ink_edge_content: [
    { label: 'Publish Article Page', agent: 'ryan_mitchell' },
    { label: 'Create Editorial Email', agent: 'emily_carter' },
    { label: 'Create Social Copy', agent: 'noah_bennett' },
  ],
};

export default function MightyTaskUnified() {
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('ink_edge_publisher');
  
  const currentConfig = CHANNEL_CONFIGS.find(c => c.key === activeChannel)!;
  const actionButtons = ACTION_BUTTONS_MAP[activeChannel];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Channel Mode Buttons */}
        <div className="flex flex-wrap gap-2">
          {CHANNEL_CONFIGS.map((channel) => {
            const Icon = channel.icon;
            const isActive = activeChannel === channel.key;
            
            return (
              <Button
                key={channel.key}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "gap-2 transition-all",
                  isActive && "ring-2 ring-offset-2 ring-primary"
                )}
                style={isActive ? {
                  background: `linear-gradient(135deg, ${channel.gradientFrom}, ${channel.gradientTo})`,
                } : undefined}
                onClick={() => setActiveChannel(channel.key)}
              >
                <span className="text-lg">{channel.emoji}</span>
                <span className="hidden sm:inline">{channel.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Channel Description */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{currentConfig.name}</span> — {currentConfig.description}
        </div>

        {/* Calendar Workspace */}
        <MightyTaskWorkspace 
          calendarSlug={currentConfig.slug}
          defaultChecklist={currentConfig.checklist}
          actionButtons={actionButtons}
        />
      </div>
    </MainLayout>
  );
}
