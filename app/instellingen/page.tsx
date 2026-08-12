'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { Field, Panel, inputClass } from '@/components/ui-kit';
import { useTranslation } from '@/lib/i18n';

export default function InstellingenPage() {
  const { t } = useTranslation();
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
              <input className={inputClass} defaultValue="Mohammed" />
            </Field>
            <Field label={t('settings_email')}>
              <input className={inputClass} type="email" defaultValue="mohammed@school.nl" />
            </Field>
            <Field label={t('settings_class')}>
              <input className={inputClass} defaultValue="VWO 4" />
            </Field>
            <Field label={t('settings_profile')}>
              <select className={inputClass}>
                <option>{t('settings_track_nt')}</option>
                <option>{t('settings_track_ng')}</option>
                <option>{t('settings_track_em')}</option>
                <option>{t('settings_track_cm')}</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t('settings_preferences')}>
          <div className="space-y-4">
            <Field label={t('settings_theme')}>
              <select className={inputClass}>
                <option>{t('settings_theme_dark')}</option>
                <option>{t('settings_theme_light')}</option>
                <option>{t('settings_theme_system')}</option>
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
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t('settings_save')}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
