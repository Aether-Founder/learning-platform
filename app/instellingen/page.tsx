'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Field, Panel, inputClass } from '@/components/ui-kit';
import { useUser, useUserProfile } from '@/hooks/useAuth';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';

const supabase = browserClient as any;

export default function InstellingenPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile } = useUserProfile();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [track, setTrack] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setEmail(user?.email || '');
      setClassLevel(profile.grade_level || '');
      setTrack(profile.track || '');
    }
  }, [profile, user]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({
        full_name: name,
        grade_level: classLevel,
        track,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user?.id);
    
    if (error) {
      console.error('Failed to save settings:', error);
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('settings_eyebrow')}
        title={t('settings_title')}
        description={t('settings_description')}
      />

      <div className="mt-10 space-y-6">
        <Panel title={t('settings_profile')}>
          <div className="space-y-4">
            <Field label={t('settings_name')}>
              <input 
                className={inputClass} 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label={t('settings_email')}>
              <input 
                className={inputClass} 
                type="email" 
                value={email}
                disabled
              />
            </Field>
            <Field label={t('settings_class')}>
              <input 
                className={inputClass} 
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="Bijv. VWO 4"
              />
            </Field>
            <Field label={t('settings_profile')}>
              <select 
                className={inputClass}
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              >
                <option value="">Kies een profiel</option>
                <option value="nt">{t('settings_track_nt')}</option>
                <option value="ng">{t('settings_track_ng')}</option>
                <option value="em">{t('settings_track_em')}</option>
                <option value="cm">{t('settings_track_cm')}</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t('settings_preferences')}>
          <div className="space-y-4">
            <Field label={t('settings_theme')}>
              <select className={inputClass}>
                <option>{t('settings_theme_system')}</option>
                <option>{t('settings_theme_light')}</option>
                <option>{t('settings_theme_dark')}</option>
              </select>
            </Field>
            <Field label={t('settings_language')}>
              <select className={inputClass}>
                <option>{t('settings_lang_nl')}</option>
                <option>{t('settings_lang_en')}</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t('settings_notifications')}>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <span className="text-sm">{t('settings_notif_daily')}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <span className="text-sm">{t('settings_notif_grades')}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" />
              <span className="text-sm">{t('settings_notif_group')}</span>
            </label>
          </div>
        </Panel>

        <div>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Opslaan...' : t('settings_save')}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
