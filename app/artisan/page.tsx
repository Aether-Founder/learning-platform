'use client';

import { AppShell, PageHeader } from '@/components/AppShell';

export default function ArtisanPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Artisan"
        title="Coming Soon"
        description="The AI-powered content generation feature is currently under development. This will be available in Phase 3."
      />
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">This feature is not yet available.</p>
      </div>
    </AppShell>
  );
}
