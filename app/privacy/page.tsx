'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/useTranslation';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Privacy"
        title={t('privacy_title')}
        description={t('privacy_description')}
      />

      <div className="mt-10 max-w-4xl space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('privacy_info_we_collect')}</h2>
          <p className="text-muted-foreground">
            {t('privacy_info_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('privacy_how_we_use')}</h2>
          <p className="text-muted-foreground">
            {t('privacy_how_we_use_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('privacy_data_security')}</h2>
          <p className="text-muted-foreground">
            {t('privacy_data_security_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('privacy_your_rights')}</h2>
          <p className="text-muted-foreground">
            {t('privacy_your_rights_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('privacy_contact')}</h2>
          <p className="text-muted-foreground">
            {t('privacy_contact_text')}
          </p>
        </section>

        <section>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
