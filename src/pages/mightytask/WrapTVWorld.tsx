import { MainLayout } from '@/layouts/MainLayout';
import { MightyTaskWorkspace } from '@/components/mightytask/MightyTaskWorkspace';

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Source content linked', completed: false },
  { id: '2', label: 'Creator intake complete', completed: false },
  { id: '3', label: 'Raw footage received', completed: false },
  { id: '4', label: 'Editing complete', completed: false },
  { id: '5', label: 'Thumbnail created', completed: false },
  { id: '6', label: 'Published to YouTube', completed: false },
  { id: '7', label: 'Social clips posted', completed: false },
];

const ACTION_BUTTONS = [
  { label: 'Plan Episode', agent: 'wraptvworld_producer' },
  { label: 'Generate Video Description', agent: 'wraptvworld_producer' },
  { label: 'Create Social Clips Copy', agent: 'noah_bennett' },
];

export default function WrapTVWorld() {
  return (
    <MainLayout>
      <div className="p-6">
        <MightyTaskWorkspace 
          calendarSlug="wraptvworld"
          defaultChecklist={DEFAULT_CHECKLIST}
          actionButtons={ACTION_BUTTONS}
        />
      </div>
    </MainLayout>
  );
}