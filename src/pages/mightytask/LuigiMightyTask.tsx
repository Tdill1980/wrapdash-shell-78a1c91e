import { MainLayout } from '@/layouts/MainLayout';
import { MightyTaskWorkspace } from '@/components/mightytask/MightyTaskWorkspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Luigi live status verified', completed: false },
  { id: '2', label: 'Greeting script updated', completed: false },
  { id: '3', label: 'Escalation paths tested', completed: false },
  { id: '4', label: 'Event logging checked', completed: false },
];

const ACTION_BUTTONS = [
  { label: 'Test Luigi Live Flow', agent: 'jordan_lee' },
  { label: 'Update Luigi Greeting', agent: 'jordan_lee' },
];

export default function LuigiMightyTask() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Luigi Status Dashboard */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-green-500" />
              Luigi Chat Status
              <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-3xl font-bold text-green-500">24/7</p>
                <p className="text-xs text-muted-foreground">Availability</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-3xl font-bold">~2s</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-3xl font-bold">Quotes</p>
                <p className="text-xs text-muted-foreground">Primary Intent</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-3xl font-bold">Orders</p>
                <p className="text-xs text-muted-foreground">Secondary Intent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MightyTask Workspace */}
        <MightyTaskWorkspace 
          calendarSlug="luigi"
          defaultChecklist={DEFAULT_CHECKLIST}
          actionButtons={ACTION_BUTTONS}
        />
      </div>
    </MainLayout>
  );
}