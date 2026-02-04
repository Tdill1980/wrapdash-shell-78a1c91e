import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Power, Clock, Calendar, Shield, RefreshCw, Rocket } from 'lucide-react';
import { useAgentSchedule } from '@/hooks/useAgentSchedule';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TIMEZONES = [
  { value: 'America/Phoenix', label: 'Arizona (Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/New_York', label: 'Eastern (New York)' },
];

const TIME_OPTIONS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
];

function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function AgentControlPanel() {
  const { 
    schedule, 
    loading, 
    saving, 
    updateSchedule, 
    toggleEnabled, 
    toggleEmergencyOff,
    toggleForceOn,
    currentStatus,
    refetch
  } = useAgentSchedule('wpw_support');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No schedule found for weprintwraps.com support. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className={currentStatus.active ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${currentStatus.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <CardTitle className="text-xl">
                weprintwraps.com support is {currentStatus.active ? 'ACTIVE' : 'INACTIVE'}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{currentStatus.reason}</CardDescription>
        </CardHeader>
      </Card>

      {/* Control Buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Force Start */}
        <Card className={schedule.force_on ? 'border-blue-500 bg-blue-500/10' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              <CardTitle>Force Start</CardTitle>
            </div>
            <CardDescription>
              Turn chat ON outside of scheduled hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant={schedule.force_on ? "outline" : "default"} 
              size="lg" 
              className={`w-full ${!schedule.force_on ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              onClick={toggleForceOn}
              disabled={saving || schedule.emergency_off}
            >
              {schedule.force_on ? (
                <>
                  <Power className="mr-2 h-5 w-5" />
                  Deactivate Force Start
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  FORCE START
                </>
              )}
            </Button>
            {schedule.force_on && (
              <p className="mt-3 text-sm text-blue-500 text-center">
                🚀 Force Start is active. Chat is ON (ignoring schedule).
              </p>
            )}
            {schedule.emergency_off && !schedule.force_on && (
              <p className="mt-3 text-sm text-muted-foreground text-center">
                Disabled while Emergency Stop is active
              </p>
            )}
          </CardContent>
        </Card>

        {/* Emergency Stop */}
        <Card className={schedule.emergency_off ? 'border-red-500 bg-red-500/10' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Emergency Stop</CardTitle>
            </div>
            <CardDescription>
              Immediately disable chat regardless of everything
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant={schedule.emergency_off ? "default" : "destructive"} 
              size="lg" 
              className="w-full"
              onClick={toggleEmergencyOff}
              disabled={saving}
            >
              {schedule.emergency_off ? (
                <>
                  <Power className="mr-2 h-5 w-5" />
                  Deactivate Emergency Stop
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  EMERGENCY STOP
                </>
              )}
            </Button>
            {schedule.emergency_off && (
              <p className="mt-3 text-sm text-red-500 text-center">
                ⚠️ Emergency stop is active. Chat will not appear on the website.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            <CardTitle>Master Toggle</CardTitle>
          </div>
          <CardDescription>
            Enable or disable weprintwraps.com support (respects schedule when enabled)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="text-base">
              Agent Enabled
            </Label>
            <Switch
              id="enabled"
              checked={schedule.enabled}
              onCheckedChange={toggleEnabled}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Schedule</CardTitle>
          </div>
          <CardDescription>
            Chat is active from "Active After" to "Active Before" (overnight window)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select 
              value={schedule.timezone} 
              onValueChange={(value) => updateSchedule({ timezone: value })}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active After */}
          <div className="space-y-2">
            <Label>Active After (Chat turns ON)</Label>
            <Select 
              value={schedule.active_after?.slice(0, 5) || '17:00'} 
              onValueChange={(value) => updateSchedule({ active_after: value })}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue>
                  {schedule.active_after ? formatTime12h(schedule.active_after.slice(0, 5)) : '5:00 PM'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TIME_OPTIONS.map(time => (
                  <SelectItem key={time} value={time}>
                    {formatTime12h(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Chat will turn ON at this time
            </p>
          </div>

          {/* Active Before */}
          <div className="space-y-2">
            <Label>Active Before (Chat turns OFF)</Label>
            <Select 
              value={schedule.active_before?.slice(0, 5) || '08:30'} 
              onValueChange={(value) => updateSchedule({ active_before: value })}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue>
                  {schedule.active_before ? formatTime12h(schedule.active_before.slice(0, 5)) : '8:30 AM'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TIME_OPTIONS.map(time => (
                  <SelectItem key={time} value={time}>
                    {formatTime12h(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Chat will turn OFF at this time (next day for overnight)
            </p>
          </div>

          {/* Schedule Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">Current Schedule:</p>
            <p className="text-sm text-muted-foreground mt-1">
              weprintwraps.com support is <span className="font-semibold text-foreground">ACTIVE</span> from{' '}
              <Badge variant="outline">{formatTime12h(schedule.active_after?.slice(0, 5) || '17:00')}</Badge>
              {' '}to{' '}
              <Badge variant="outline">{formatTime12h(schedule.active_before?.slice(0, 5) || '08:30')}</Badge>
              {' '}({schedule.timezone})
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This is an overnight schedule: Chat runs after-hours from 5PM to 8:30AM the next day.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekend Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Weekend Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekends" className="text-base">
                Active on Weekends
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, chat follows the same schedule on Saturday & Sunday
              </p>
            </div>
            <Switch
              id="weekends"
              checked={schedule.active_weekends}
              onCheckedChange={(checked) => updateSchedule({ active_weekends: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">How This Works</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>WordPress never needs to change - it loads the same static script</li>
                <li>The widget checks WrapCommand before rendering</li>
                <li>If chat is inactive, the chat bubble simply doesn't appear</li>
                <li>Emergency Stop overrides all other settings instantly</li>
                <li>All changes take effect immediately - no deployment needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
