'use client';

import { useState, type FormEvent } from 'react';
import { Bot, BookOpen, Send, Sparkles, User } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/useTranslation';

type Message = { role: 'tutor' | 'student'; text: string };

const STARTER_KEYS = ['tutor_suggestion_1', 'tutor_suggestion_2', 'tutor_suggestion_3'];

function localAnswer(prompt: string) {
  if (prompt.toLowerCase().includes('formule'))
    return 'Begin met het systeem: welke grootheden ken je en wat wordt gevraagd? Bij arbeid gebruik je W = F · s · cos(α). Bij kinetische energie is Eₖ = ½ · m · v². Ik kan daarna samen een voorbeeld uitwerken.';
  if (prompt.toLowerCase().includes('oefenvragen'))
    return '1. Een kracht van 20 N verplaatst een voorwerp 3 m. Hoeveel arbeid verricht de kracht?\n2. Wanneer is arbeid nul?\n3. Waar komt de kinetische energie vandaan bij een vallend voorwerp?';
  return 'Energiebehoud betekent dat energie niet verdwijnt: ze verandert alleen van vorm. Denk aan een achtbaan: bovenaan heeft het karretje vooral zwaarte-energie, onderaan vooral bewegingsenergie. Zal ik dit met een oefening toepassen?';
}

export default function TutorPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'tutor', text: t('tutor_greeting', undefined, { name: 'Mohammed' }) },
  ]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = prompt.trim();
    if (!question || busy) return;
    setMessages((current) => [...current, { role: 'student', text: question }]);
    setPrompt('');
    setBusy(true);
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (response.ok) {
        const data = (await response.json()) as { answer?: string };
        setMessages((current) => [
          ...current,
          { role: 'tutor', text: data.answer || localAnswer(question) },
        ]);
      } else {
        setMessages((current) => [...current, { role: 'tutor', text: localAnswer(question) }]);
      }
    } catch {
      setMessages((current) => [...current, { role: 'tutor', text: localAnswer(question) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('tutor_eyebrow')}
        title={t('tutor_title')}
        description={t('tutor_description')}
        action={
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('tutor_context_active')}
          </div>
        }
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="flex min-h-[560px] flex-col rounded-xl border border-border bg-card">
          <div className="flex-1 space-y-5 p-6">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === 'student' ? 'flex-row-reverse' : ''}`}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                  {message.role === 'tutor' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[78%] whitespace-pre-line rounded-xl px-4 py-3 text-sm leading-relaxed ${message.role === 'student' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-muted-foreground">{t('tutor_busy')}</p>}
          </div>
          <form onSubmit={ask} className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t('tutor_placeholder')}
                className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
                aria-label={t('tutor_aria')}
              />
              <button
                type="submit"
                disabled={busy || !prompt.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              <h2 className="font-semibold">{t('tutor_try')}</h2>
            </div>
            <div className="mt-4 space-y-2">
              {STARTER_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPrompt(t(key))}
                  className="w-full rounded-md border border-border px-3 py-2 text-left text-xs leading-relaxed transition-colors hover:bg-secondary"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">{t('tutor_sources')}</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Natuurkunde · Kracht, arbeid en energie
              <br />3 lessen · 12 begrippen gekoppeld
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
