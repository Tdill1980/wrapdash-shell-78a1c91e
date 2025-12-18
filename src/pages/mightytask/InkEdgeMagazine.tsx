import { MainLayout } from '@/layouts/MainLayout';
import { MightyTaskWorkspace } from '@/components/mightytask/MightyTaskWorkspace';

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Article intake complete', completed: false },
  { id: '2', label: 'Editorial review done', completed: false },
  { id: '3', label: 'Design/layout approved', completed: false },
  { id: '4', label: 'Published to magazine', completed: false },
  { id: '5', label: 'Distribution assets prepared', completed: false },
];

const ACTION_BUTTONS = [
  { label: 'Generate Magazine Outline', agent: 'ryan_mitchell' },
  { label: 'Edit Article', agent: 'ryan_mitchell' },
  { label: 'Prepare Distribution Assets', agent: 'ryan_mitchell' },
];

export default function InkEdgeMagazine() {
  return (
    <MainLayout>
      <div className="p-6">
        <MightyTaskWorkspace 
          calendarSlug="ink_edge_mag"
          defaultChecklist={DEFAULT_CHECKLIST}
          actionButtons={ACTION_BUTTONS}
        />
      </div>
    </MainLayout>
  );
}