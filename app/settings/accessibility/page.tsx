'use client';

import { useEffect, useState } from 'react';
import { Accessibility, Check, Loader2, Save } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';

type Complexity = 'simplified' | 'standard' | 'advanced';
type Preferences = { dyslexiaFont: boolean; highContrast: boolean; readAloud: boolean; complexity: Complexity };
const DEFAULTS: Preferences = { dyslexiaFont: false, highContrast: false, readAloud: false, complexity: 'standard' };
const COMPLEXITY: Complexity[] = ['simplified', 'standard', 'advanced'];
const COMPLEXITY_LABEL_KEYS: Record<Complexity, string> = {
  simplified: 'a11y_complexity_easy',
  standard: 'a11y_complexity_default',
  advanced: 'a11y_complexity_advanced_label',
};

export default function AccessibilitySettingsPage() {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusKey, setStatusKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const client = supabase as any;
      const { data } = await client.from('user_profiles').select('dyslexia_friendly_font, high_contrast_mode, read_aloud_on_hover, text_complexity').eq('user_id', user.id).maybeSingle();
      if (!cancelled && data) setPreferences({ dyslexiaFont: Boolean(data.dyslexia_friendly_font), highContrast: Boolean(data.high_contrast_mode), readAloud: Boolean(data.read_aloud_on_hover), complexity: COMPLEXITY.includes(data.text_complexity) ? data.text_complexity : 'standard' });
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-high-contrast', preferences.highContrast);
    document.documentElement.toggleAttribute('data-dyslexia-font', preferences.dyslexiaFont);
  }, [preferences.dyslexiaFont, preferences.highContrast]);

  const save = async () => {
    setSaving(true);
    setStatusKey('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatusKey('a11y_login_required'); return; }
      const client = supabase as any;
      const { error } = await client.from('user_profiles').upsert({ user_id: user.id, dyslexia_friendly_font: preferences.dyslexiaFont, high_contrast_mode: preferences.highContrast, read_aloud_on_hover: preferences.readAloud, text_complexity: preferences.complexity }, { onConflict: 'user_id' });
      if (error) throw error;
      setStatusKey('a11y_saved');
    } catch {
      setStatusKey('a11y_save_failed');
    } finally {
      setSaving(false);
    }
  };

  const setToggle = (key: 'dyslexiaFont' | 'highContrast' | 'readAloud', value: boolean) => setPreferences((current) => ({ ...current, [key]: value }));
  const complexityIndex = COMPLEXITY.indexOf(preferences.complexity);

  return (
    <AppShell>
      <PageHeader eyebrow={t('a11y_eyebrow')} title={t('a11y_title')} description={t('a11y_description')} action={<div className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><Accessibility className="h-5 w-5" /></div>} />
      <div className="mx-auto mt-10 max-w-2xl space-y-6">
        <Card><CardHeader><CardTitle>{t('a11y_comfort')}</CardTitle><CardDescription>{t('a11y_comfort_desc')}</CardDescription></CardHeader><CardContent className="space-y-6">{loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('a11y_loading')}</div> : <><div className="flex items-center justify-between gap-6"><div><Label htmlFor="dyslexia-font">{t('a11y_dyslexia')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('a11y_dyslexia_desc')}</p></div><Switch id="dyslexia-font" checked={preferences.dyslexiaFont} onCheckedChange={(value) => setToggle('dyslexiaFont', value)} aria-label={t('a11y_dyslexia')} /></div><div className="flex items-center justify-between gap-6"><div><Label htmlFor="high-contrast">{t('a11y_contrast')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('a11y_contrast_desc')}</p></div><Switch id="high-contrast" checked={preferences.highContrast} onCheckedChange={(value) => setToggle('highContrast', value)} aria-label={t('a11y_contrast')} /></div><div className="flex items-center justify-between gap-6"><div><Label htmlFor="read-aloud">{t('a11y_read_aloud')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('a11y_read_aloud_desc')}</p></div><Switch id="read-aloud" checked={preferences.readAloud} onCheckedChange={(value) => setToggle('readAloud', value)} aria-label={t('a11y_read_aloud')} /></div></>}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('a11y_complexity')}</CardTitle><CardDescription>{t('a11y_complexity_desc')}</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t(COMPLEXITY_LABEL_KEYS[COMPLEXITY[0]])}</span><span className="font-medium">{t(COMPLEXITY_LABEL_KEYS[preferences.complexity])}</span><span className="text-muted-foreground">{t(COMPLEXITY_LABEL_KEYS[COMPLEXITY[2]])}</span></div><input type="range" min="0" max="2" step="1" value={complexityIndex} onChange={(event) => setPreferences((current) => ({ ...current, complexity: COMPLEXITY[Number(event.target.value)] }))} className="mt-4 h-2 w-full cursor-pointer accent-foreground" aria-label={t('a11y_complexity_slider')} /><div className="mt-3 grid grid-cols-3 text-center text-[11px] text-muted-foreground"><span>{t('a11y_complexity_easy')}</span><span>{t('a11y_complexity_default')}</span><span>{t('a11y_complexity_advanced_label')}</span></div></CardContent></Card>
        <div className="flex items-center justify-between gap-4"><p role="status" className="text-sm text-muted-foreground">{statusKey && (statusKey === 'a11y_saved' ? <span className="inline-flex items-center gap-1.5 text-emerald-600"><Check className="h-4 w-4" /> {t(statusKey)}</span> : t(statusKey))}</p><Button onClick={save} disabled={saving || loading}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('a11y_saving')}</> : <><Save className="mr-2 h-4 w-4" /> {t('a11y_save')}</>}</Button></div>
      </div>
    </AppShell>
  );
}
