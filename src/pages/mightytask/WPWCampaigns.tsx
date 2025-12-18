import { MainLayout } from '@/layouts/MainLayout';
import { MightyTaskWorkspace } from '@/components/mightytask/MightyTaskWorkspace';

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Source content linked', completed: false },
  { id: '2', label: 'Campaign copy written', completed: false },
  { id: '3', label: 'Email template designed', completed: false },
  { id: '4', label: 'Segment selected', completed: false },
  { id: '5', label: 'Scheduled in Klaviyo', completed: false },
  { id: '6', label: 'Luigi ordering line added', completed: false },
];

const ACTION_BUTTONS = [
  { label: 'Create WPW Email Campaign', agent: 'emily_carter' },
  { label: 'Adapt Article for WPW', agent: 'emily_carter' },
  { label: 'Add Luigi Ordering Line', agent: 'jordan_lee' },
];

export default function WPWCampaigns() {
  return (
    <MainLayout>
      <div className="p-6">
        <MightyTaskWorkspace 
          calendarSlug="wpw_campaigns"
          defaultChecklist={DEFAULT_CHECKLIST}
          actionButtons={ACTION_BUTTONS}
        />
      </div>
    </MainLayout>
  );
}