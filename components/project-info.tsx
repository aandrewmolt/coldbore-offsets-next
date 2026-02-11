'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { ClipboardList } from 'lucide-react';

export function ProjectInfo() {
  const projectInfo = useAppStore((s) => s.projectInfo);
  const setProjectInfo = useAppStore((s) => s.setProjectInfo);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" />
          Project Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="client-name">Client / Company</Label>
          <Input
            id="client-name"
            placeholder="Enter client name"
            value={projectInfo.clientName}
            onChange={(e) => setProjectInfo({ clientName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="job-name">Job / Lease Name</Label>
          <Input
            id="job-name"
            placeholder="Enter job or lease name"
            value={projectInfo.jobName}
            onChange={(e) => setProjectInfo({ jobName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="job-datetime">Job Date & Time</Label>
          <Input
            id="job-datetime"
            type="datetime-local"
            value={projectInfo.jobDateTime ? new Date(projectInfo.jobDateTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => setProjectInfo({ jobDateTime: e.target.value ? new Date(e.target.value) : null })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="project-notes">Notes</Label>
          <Textarea
            id="project-notes"
            placeholder="Additional project notes..."
            value={projectInfo.projectNotes}
            onChange={(e) => setProjectInfo({ projectNotes: e.target.value })}
            className="min-h-[60px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
