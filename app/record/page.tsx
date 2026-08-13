'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Mic, Pause, Play, Square, Trash2, Volume2 } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/useTranslation';

export default function RecordPage() {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording || paused) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording, paused]);

  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.current = nextStream;
    chunks.current = [];
    const nextRecorder = new MediaRecorder(nextStream);
    nextRecorder.ondataavailable = (event) => event.data.size && chunks.current.push(event.data);
    nextRecorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks.current, { type: 'audio/webm' }));
      setAudioUrl(url);
      nextStream.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
    nextRecorder.start();
    recorder.current = nextRecorder;
    setElapsed(0);
    setRecording(true);
    setPaused(false);
  };

  const stop = () => {
    recorder.current?.stop();
    recorder.current = null;
    setRecording(false);
    setPaused(false);
  };

  const togglePause = () => {
    const current = recorder.current;
    if (!current) return;
    if (current.state === 'recording') {
      current.pause();
      setPaused(true);
    } else {
      current.resume();
      setPaused(false);
    }
  };

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsed(0);
  };

  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <AppShell>
      <PageHeader eyebrow={t('record_eyebrow')} title={t('record_title')} description={t('record_description')} />
      <div className="mx-auto mt-10 max-w-3xl">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex min-h-[330px] flex-col items-center justify-center p-8 text-center">
            <div className={`grid h-28 w-28 place-items-center rounded-full border ${recording ? 'border-rose-500/50 bg-rose-500/10' : 'border-border bg-secondary'}`}><Mic className={`h-10 w-10 ${recording ? 'text-rose-500' : 'text-muted-foreground'}`} /></div>
            <p className="mt-7 font-display text-4xl font-semibold tabular-nums">{time}</p>
            <p className="mt-2 text-sm text-muted-foreground">{recording ? paused ? t('record_paused') : t('record_recording') : t('record_ready')}</p>
            <div className="mt-8 flex items-center gap-3">
              {!recording ? <button type="button" onClick={start} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"><Play className="h-4 w-4" /> {t('record_start')}</button> : <><button type="button" onClick={togglePause} className="grid h-11 w-11 place-items-center rounded-md border border-border hover:bg-secondary" aria-label={paused ? t('record_resume') : t('record_pause')}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button><button type="button" onClick={stop} className="inline-flex h-11 items-center gap-2 rounded-md bg-rose-600 px-5 text-sm font-medium text-white hover:bg-rose-700"><Square className="h-4 w-4" /> {t('record_stop')}</button></>}
            </div>
          </div>
          {audioUrl && <div className="flex flex-wrap items-center gap-4 border-t border-border p-5"><Volume2 className="h-4 w-4 text-muted-foreground" /><audio className="min-w-[220px] flex-1" controls src={audioUrl}>{t('record_unsupported')}</audio><a href={audioUrl} download="aether-college.webm" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"><Download className="h-4 w-4" /> {t('record_download')}</a><button type="button" onClick={discard} className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={t('record_delete')}><Trash2 className="h-4 w-4" /></button></div>}
        </section>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t('record_footer')}</p>
      </div>
    </AppShell>
  );
}
