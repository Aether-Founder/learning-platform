'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Check, FileImage, FileText, Link2, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';

const OUTPUTS = [
  { id: 'outline', labelKey: 'artisan_output_outline', descKey: 'artisan_output_outline_desc' },
  { id: 'fsrs', labelKey: 'artisan_output_flashcards', descKey: 'artisan_output_flashcards_desc' },
  { id: 'mcq', labelKey: 'artisan_output_mcq', descKey: 'artisan_output_mcq_desc' },
  { id: 'feynman', labelKey: 'artisan_output_feynman', descKey: 'artisan_output_feynman_desc' },
] as const;

type OutputId = (typeof OUTPUTS)[number]['id'];

type QueueState = 'idle' | 'uploading' | 'queued' | 'error';

export default function ArtisanPage() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [context, setContext] = useState('');
  const [outputs, setOutputs] = useState<OutputId[]>(['outline', 'fsrs']);
  const [state, setState] = useState<QueueState>('idle');
  const [message, setMessage] = useState('');

  const addFiles = (incoming: File[]) => {
    const supported = incoming.filter((file) => file.type === 'application/pdf' || file.type.startsWith('image/'));
    setFiles((current) => [...current, ...supported.filter((file) => !current.some((existing) => existing.name === file.name))]);
    if (supported.length < incoming.length) setMessage(t('artisan_validate_files'));
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); };
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => addFiles(Array.from(event.target.files || []));
  const toggleOutput = (id: OutputId, checked: boolean) => setOutputs((current) => checked ? [...current, id] : current.filter((value) => value !== id));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!files.length && !youtubeUrl.trim()) { setState('error'); setMessage(t('artisan_validate_source')); return; }
    if (!outputs.length) { setState('error'); setMessage(t('artisan_validate_output')); return; }
    setState('uploading');
    setMessage(t('artisan_storing'));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const owner = user?.id || 'anonymous';
      const client = supabase as any;
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const { error } = await client.storage.from('materials').upload(`${owner}/${Date.now()}-${safeName}`, file, { upsert: false });
        if (error) throw error;
      }
      setState('queued');
      setMessage(t('artisan_queued'));
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : t('artisan_error'));
    }
  };

  return (
    <AppShell>
      <PageHeader eyebrow={t('artisan_eyebrow')} title={t('artisan_title')} description={t('artisan_description')} action={<div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-warning" /> {t('artisan_badge')}</div>} />
      <form onSubmit={submit} className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section><div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()} className="group cursor-pointer rounded-xl border border-dashed border-border bg-card p-8 text-center transition-colors hover:border-foreground/50 hover:bg-secondary/30"><input ref={inputRef} type="file" accept="application/pdf,image/*" multiple onChange={handleInput} className="hidden" /><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary group-hover:bg-background"><Upload className="h-6 w-6 text-muted-foreground" /></div><h2 className="mt-5 font-display text-2xl font-semibold">{t('artisan_dropzone')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('artisan_dropzone_hint')}</p><div className="mt-6 flex justify-center gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><FileText className="h-3.5 w-3.5" /> {t('artisan_file_pdf')}</span><span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><FileImage className="h-3.5 w-3.5" /> {t('artisan_file_images')}</span></div></div>{files.length > 0 && <div className="mt-3 space-y-2">{files.map((file) => <div key={file.name} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"><span className="flex min-w-0 items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" />{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((item) => item.name !== file.name))} className="text-muted-foreground hover:text-foreground" aria-label={t('artisan_remove_file', undefined, { name: file.name })}><X className="h-4 w-4" /></button></div>)}</div>}</section>
          <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-semibold">{t('artisan_youtube_title')}</h2></div><Input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder={t('artisan_youtube_placeholder')} className="mt-4" /></section>
          <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">{t('artisan_context_title')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('artisan_context_desc')}</p><Textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder={t('artisan_context_placeholder')} className="mt-4 min-h-28" /></section>
        </div>
        <div className="space-y-6"><section className="rounded-xl border border-border bg-card p-5"><h2 className="font-display text-xl font-semibold">{t('artisan_output_title')}</h2><div className="mt-5 space-y-3">{OUTPUTS.map((output) => <label key={output.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"><Checkbox checked={outputs.includes(output.id)} onCheckedChange={(checked) => toggleOutput(output.id, checked === true)} /><span><span className="block text-sm font-medium">{t(output.labelKey)}</span><span className="mt-0.5 block text-xs text-muted-foreground">{t(output.descKey)}</span></span></label>)}</div><Button type="submit" disabled={state === 'uploading'} className="mt-6 w-full">{state === 'uploading' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('artisan_uploading')}</> : <><Sparkles className="mr-2 h-4 w-4" /> {t('artisan_start')}</>}</Button></section>
          <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{t('artisan_job_status')}</h2>{state === 'queued' && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> {t('artisan_status_queued')}</span>}</div>{state === 'idle' && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('artisan_idle_desc')}</p>}{state === 'queued' && <div className="mt-4 rounded-md bg-secondary p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{t('artisan_log_received')}<br />{t('artisan_log_worker')}<br />{t('artisan_log_realtime')}</div>}{(state === 'error' || state === 'uploading') && <p className={`mt-4 text-xs ${state === 'error' ? 'text-rose-500' : 'text-muted-foreground'}`}>{message}</p>}</section></div>
      </form>
      {state === 'queued' && <p className="mt-4 text-center text-xs text-muted-foreground">{t('artisan_queued_summary', undefined, { message, labels: outputs.map((id) => t(OUTPUTS.find((output) => output.id === id)!.labelKey)).join(', ') })}</p>}
    </AppShell>
  );
}
