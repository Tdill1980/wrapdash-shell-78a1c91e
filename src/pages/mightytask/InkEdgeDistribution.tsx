import { MainLayout } from '@/layouts/MainLayout';
import { MightyTaskWorkspace } from '@/components/mightytask/MightyTaskWorkspace';

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Source content linked', completed: false },
  { id: '2', label: 'Article page published', completed: false },
  { id: '3', label: 'Editorial email sent', completed: false },
  { id: '4', label: 'IG post created', completed: false },
  { id: '5', label: 'FB post created', completed: false },
  { id: '6', label: 'Story posted', completed: false },
];

const ACTION_BUTTONS = [
  { label: 'Publish Article Page', agent: 'ryan_mitchell' },
  { label: 'Create Editorial Email', agent: 'emily_carter' },
  { label: 'Create Social Copy', agent: 'noah_bennett' },
];

export default function InkEdgeDistribution() {
  return (
    <MainLayout>
      <div className="p-6">
        <MightyTaskWorkspace 
          calendarSlug="ink_edge_dist"
          defaultChecklist={DEFAULT_CHECKLIST}
          actionButtons={ACTION_BUTTONS}
        />
      </div>
    </MainLayout>
  );
}