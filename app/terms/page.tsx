'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/useTranslation';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <PageHeader eyebrow="Terms" title={t('terms_title')} description={t('terms_description')} />

      <div className="mt-10 max-w-4xl space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_acceptance')}</h2>
          <p className="text-muted-foreground">{t('terms_acceptance_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_user_accounts')}</h2>
          <p className="text-muted-foreground">{t('terms_user_accounts_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_user_content')}</h2>
          <p className="text-muted-foreground">{t('terms_user_content_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_prohibited_uses')}</h2>
          <p className="text-muted-foreground">{t('terms_prohibited_uses_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_termination')}</h2>
          <p className="text-muted-foreground">{t('terms_termination_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_changes')}</h2>
          <p className="text-muted-foreground">{t('terms_changes_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('terms_contact')}</h2>
          <p className="text-muted-foreground">{t('terms_contact_text')}</p>
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
