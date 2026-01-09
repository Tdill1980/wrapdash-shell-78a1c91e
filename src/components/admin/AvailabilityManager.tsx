import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Save, Loader2 } from "lucide-react";
import { useTeamAvailability, type TeamMemberSchedule } from "@/hooks/useTeamAvailability";

const TEAM_MEMBERS = [
  { name: 'jackson', label: 'Jackson', role: 'Commercial / Rush / Bulk' },
  { name: 'lance', label: 'Lance', role: 'Design / File Review' },
  { name: 'trish', label: 'Trish', role: 'VIP / Partnerships' },
  { name: 'manny', label: 'Manny', role: 'Owner' },
];

interface MemberEditorProps {
  member: typeof TEAM_MEMBERS[0];
  schedule: TeamMemberSchedule | undefined;
  onSave: (agentName: string, updates: Partial<TeamMemberSchedule>) => Promise<void>;
  saving: boolean;
}

function MemberAvailabilityEditor({ member, schedule, onSave, saving }: MemberEditorProps) {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false);
  const [activeAfter, setActiveAfter] = useState(schedule?.active_after?.slice(0, 5) ?? '09:00');
  const [activeBefore, setActiveBefore] = useState(schedule?.active_before?.slice(0, 5) ?? '17:00');
  const [activeWeekends, setActiveWeekends] = useState(schedule?.active_weekends ?? false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = async () => {
    await onSave(member.name, {
      enabled,
      active_after: activeAfter,
      active_before: activeBefore,
      active_weekends: activeWeekends,
    });
    setIsDirty(false);
  };

  const markDirty = () => setIsDirty(true);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{member.label}</CardTitle>
          </div>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? 'Taking Calls' : 'Not Available'}
          </Badge>
        </div>
        <CardDescription className="text-xs">{member.role}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${member.name}-enabled`} className="text-sm">
            Available for calls
          </Label>
          <Switch
            id={`${member.name}-enabled`}
            checked={enabled}
            onCheckedChange={(v) => { setEnabled(v); markDirty(); }}
          />
        </div>

        {enabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`${member.name}-after`} className="text-xs text-muted-foreground">
                  Available from
                </Label>
                <Input
                  id={`${member.name}-after`}
                  type="time"
                  value={activeAfter}
                  onChange={(e) => { setActiveAfter(e.target.value); markDirty(); }}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${member.name}-before`} className="text-xs text-muted-foreground">
                  Available until
                </Label>
                <Input
                  id={`${member.name}-before`}
                  type="time"
                  value={activeBefore}
                  onChange={(e) => { setActiveBefore(e.target.value); markDirty(); }}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor={`${member.name}-weekends`} className="text-sm">
                Available on weekends
              </Label>
              <Switch
                id={`${member.name}-weekends`}
                checked={activeWeekends}
                onCheckedChange={(v) => { setActiveWeekends(v); markDirty(); }}
              />
            </div>
          </>
        )}

        {isDirty && (
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function AvailabilityManager() {
  const { schedules, loading, saving, updateAvailability, getAvailability } = useTeamAvailability();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Team Availability</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Set when each team member is available for customer calls. Alex will only propose times within these windows.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEAM_MEMBERS.map((member) => (
          <MemberAvailabilityEditor
            key={member.name}
            member={member}
            schedule={getAvailability(member.name)}
            onSave={updateAvailability}
            saving={saving}
          />
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>How this works:</strong> When you assign a call request to a team member, 
            Alex will read their availability and propose times only within those hours. 
            No availability = Alex will say "I'll have someone follow up."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
