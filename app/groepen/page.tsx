'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { PrimaryButton } from '@/components/ui-kit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Lock, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type Group = {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
};

export default function GroepenPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch groups:', error);
    } else {
      setGroups(data || []);
    }
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: formData.name,
        description: formData.description || null,
        is_public: formData.is_public,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create group:', error);
    } else if (data) {
      setGroups([data, ...groups]);
      setShowDialog(false);
      setFormData({ name: '', description: '', is_public: false });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('groups_eyebrow')}
          title={t('groups_title')}
          description={t('groups_description')}
        />
        <div className="mt-10 text-center text-sm text-muted-foreground">Laden...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('groups_eyebrow')}
        title={t('groups_title')}
        description={t('groups_description')}
        action={
          <PrimaryButton onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('groups_create')}
          </PrimaryButton>
        }
      />

      <div className="mt-10">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{t('groups_empty')}</p>
            <p className="text-sm text-muted-foreground">
              Maak je eerste groep om samen te studeren met klasgenoten
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border border-border bg-card p-6 hover:border-foreground/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {group.is_public ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {group.is_public ? 'Openbaar' : 'Privé'}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{group.member_count} leden</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe groep maken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Groepsnaam</Label>
              <Input
                id="group-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. Wiskunde H5"
              />
            </div>
            <div>
              <Label htmlFor="group-description">Beschrijving (optioneel)</Label>
              <Input
                id="group-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschrijf het doel van deze groep"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="group-public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="group-public" className="text-sm">
                Openbare groep (iedereen kan zoeken en deelnemen)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCreateGroup} disabled={!formData.name.trim()}>
              Groep maken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
