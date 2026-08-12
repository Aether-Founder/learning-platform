import { useEffect, useMemo, useRef, useState } from "react";

import type { Card } from "@/lib/aether-data";

/* -------------------------------- helpers -------------------------------- */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function optionsFor(cards: Card[], correct: Card, count = 4): Card[] {
  const others = shuffle(cards.filter((c) => c.term !== correct.term)).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

const MODES = [
  { id: "flashcards", label: "Flashcards", hint: "Omdraaien en herhalen" },
  { id: "mcq", label: "Meerkeuze", hint: "Kies de juiste definitie" },
  { id: "write", label: "Schrijven", hint: "Typ het antwoord" },
  { id: "test", label: "Toets", hint: "Volledige toets met cijfer" },
  { id: "quiz", label: "Quiz", hint: "Meerkeuze tegen de klok" },
  { id: "match", label: "Match", hint: "Koppel term aan definitie" },
  { id: "game", label: "Game", hint: "Goed of fout — snelvuur" },
] as const;

type Mode = (typeof MODES)[number]["id"];

const btnBase =
  "h-9 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-40";
const btnPrimary =
  "h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40";

function Progress({ value, total }: { value: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-[3px] w-32 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-foreground/70 transition-all"
          style={{ width: `${total ? (value / total) * 100 : 0}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {value} / {total}
      </span>
    </div>
  );
}

/* ------------------------------- flashcards ------------------------------- */

function Flashcards({ cards }: { cards: Card[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i]!;

  const go = (d: number) => {
    setFlipped(false);
    setI((p) => (p + d + cards.length) % cards.length);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-secondary/40 px-8 py-12 text-center transition-colors hover:border-foreground/30"
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {flipped ? "Definitie" : "Term"}
        </span>
        <span className="font-display text-3xl font-semibold leading-snug">
          {flipped ? card.definition : card.term}
        </span>
        <span className="mt-2 text-xs text-muted-foreground">Klik om om te draaien</span>
      </button>
      <div className="mt-5 flex items-center justify-between gap-4">
        <Progress value={i + 1} total={cards.length} />
        <div className="flex gap-2">
          <button type="button" className={btnBase} onClick={() => go(-1)}>
            Vorige
          </button>
          <button type="button" className={btnPrimary} onClick={() => go(1)}>
            Volgende
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- mcq ---------------------------------- */

function Mcq({ cards, timed = false }: { cards: Card[]; timed?: boolean }) {
  const [order, setOrder] = useState(() => shuffle(cards));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const card = order[i];
  const options = useMemo(() => (card ? optionsFor(cards, card) : []), [card, cards]);

  useEffect(() => {
    if (!timed || !card || picked) return;
    setTime(20);
    const t = setInterval(() => setTime((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [i, timed, card, picked]);

  useEffect(() => {
    if (timed && time === 0 && !picked && card) setPicked("—");
  }, [time, timed, picked, card]);

  const restart = () => {
    setOrder(shuffle(cards));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  if (!card) {
    return (
      <Result score={score} total={order.length} onRestart={restart} />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Progress value={i + 1} total={order.length} />
        {timed && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums tint-warning">
            {time}s
          </span>
        )}
      </div>
      <div className="rounded-lg border border-border p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Term</p>
        <p className="mt-2 font-display text-2xl font-semibold">{card.term}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {options.map((o) => {
            const isCorrect = o.term === card.term;
            const state =
              picked === null
                ? "border-border hover:border-foreground/40"
                : isCorrect
                  ? "border-success text-success"
                  : o.definition === picked
                    ? "border-destructive text-destructive"
                    : "border-border opacity-60";
            return (
              <button
                key={o.term}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(o.definition);
                  if (isCorrect) setScore((s) => s + 1);
                }}
                className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${state}`}
              >
                {o.definition}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Score: <span className="tabular-nums text-foreground">{score}</span>
        </span>
        <button
          type="button"
          className={btnPrimary}
          disabled={picked === null}
          onClick={() => {
            setPicked(null);
            setI((p) => p + 1);
          }}
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

function Result({
  score,
  total,
  onRestart,
}: {
  score: number;
  total: number;
  onRestart: () => void;
}) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-border p-8 text-center">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Resultaat</p>
      <p className="mt-2 font-display text-5xl font-semibold tabular-nums">{pct}%</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {score} van {total} goed
      </p>
      <button type="button" className={`${btnPrimary} mt-6`} onClick={onRestart}>
        Opnieuw
      </button>
    </div>
  );
}

/* --------------------------------- write --------------------------------- */

function Write({ cards }: { cards: Card[] }) {
  const [order, setOrder] = useState(() => shuffle(cards));
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const card = order[i];

  if (!card) {
    return (
      <Result
        score={score}
        total={order.length}
        onRestart={() => {
          setOrder(shuffle(cards));
          setI(0);
          setScore(0);
          setValue("");
          setChecked(null);
        }}
      />
    );
  }

  const check = () => {
    const ok = value.trim().toLowerCase() === card.term.trim().toLowerCase();
    setChecked(ok);
    if (ok) setScore((s) => s + 1);
  };

  return (
    <div>
      <div className="mb-4">
        <Progress value={i + 1} total={order.length} />
      </div>
      <div className="rounded-lg border border-border p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Definitie</p>
        <p className="mt-2 text-lg leading-snug">{card.definition}</p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checked === null && check()}
          placeholder="Typ de term"
          aria-label="Antwoord"
          className={
            "mt-5 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground " +
            (checked === null
              ? "border-border focus:border-foreground/40"
              : checked
                ? "border-success text-success"
                : "border-destructive text-destructive")
          }
        />
        {checked === false && (
          <p className="mt-2 text-xs text-muted-foreground">
            Juiste antwoord: <span className="text-foreground">{card.term}</span>
          </p>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Score: <span className="tabular-nums text-foreground">{score}</span>
        </span>
        {checked === null ? (
          <button type="button" className={btnPrimary} onClick={check}>
            Controleren
          </button>
        ) : (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setChecked(null);
              setValue("");
              setI((p) => p + 1);
            }}
          >
            Volgende
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- test --------------------------------- */

function Test({ cards }: { cards: Card[] }) {
  const [order, setOrder] = useState(() => shuffle(cards));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const correct = order.filter(
    (c) => (answers[c.term] ?? "").trim().toLowerCase() === c.term.trim().toLowerCase(),
  ).length;
  const grade = order.length ? Math.max(1, (correct / order.length) * 9 + 1).toFixed(1) : "—";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3">
        <p className="text-sm text-muted-foreground">
          {order.length} open vragen · schrijf de term bij elke definitie
        </p>
        {submitted && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold tint-success">
            Cijfer {grade}
          </span>
        )}
      </div>
      <ol className="divide-y divide-border">
        {order.map((c, idx) => {
          const val = answers[c.term] ?? "";
          const ok = val.trim().toLowerCase() === c.term.trim().toLowerCase();
          return (
            <li key={c.term} className="grid gap-3 py-5 sm:grid-cols-[1.4fr_1fr] sm:items-center">
              <p className="text-sm leading-snug">
                <span className="mr-2 text-xs tabular-nums text-muted-foreground">{idx + 1}.</span>
                {c.definition}
              </p>
              <div>
                <input
                  value={val}
                  disabled={submitted}
                  onChange={(e) => setAnswers((a) => ({ ...a, [c.term]: e.target.value }))}
                  placeholder="Antwoord"
                  aria-label={`Antwoord vraag ${idx + 1}`}
                  className={
                    "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground " +
                    (!submitted
                      ? "border-border focus:border-foreground/40"
                      : ok
                        ? "border-success text-success"
                        : "border-destructive text-destructive")
                  }
                />
                {submitted && !ok && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Juist: {c.term}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {submitted ? `${correct} van ${order.length} goed` : "Nog niet ingeleverd"}
        </span>
        {submitted ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setOrder(shuffle(cards));
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Nieuwe toets
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={() => setSubmitted(true)}>
            Inleveren
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- match --------------------------------- */

function Match({ cards }: { cards: Card[] }) {
  const pool = useMemo(() => cards.slice(0, 6), [cards]);
  const [terms, setTerms] = useState(() => shuffle(pool));
  const [defs, setDefs] = useState(() => shuffle(pool));
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const finished = done.length === pool.length;

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const pickDef = (term: string) => {
    if (!selected) return;
    if (selected === term) {
      setDone((d) => [...d, term]);
      setSelected(null);
    } else {
      setWrong(term);
      setTimeout(() => setWrong(null), 400);
      setSelected(null);
    }
  };

  const reset = () => {
    setTerms(shuffle(pool));
    setDefs(shuffle(pool));
    setDone([]);
    setSelected(null);
    setSeconds(0);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Progress value={done.length} total={pool.length} />
        <span className="text-xs tabular-nums text-muted-foreground">{seconds}s</span>
      </div>
      {finished ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Voltooid</p>
          <p className="mt-2 font-display text-5xl font-semibold tabular-nums">{seconds}s</p>
          <button type="button" className={`${btnPrimary} mt-6`} onClick={reset}>
            Opnieuw
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            {terms.map((c) => (
              <button
                key={c.term}
                type="button"
                disabled={done.includes(c.term)}
                onClick={() => setSelected(c.term)}
                className={
                  "w-full rounded-md border px-4 py-3 text-left text-sm transition-colors " +
                  (done.includes(c.term)
                    ? "border-border opacity-30"
                    : selected === c.term
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground/40")
                }
              >
                {c.term}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {defs.map((c) => (
              <button
                key={c.term}
                type="button"
                disabled={done.includes(c.term)}
                onClick={() => pickDef(c.term)}
                className={
                  "w-full rounded-md border px-4 py-3 text-left text-sm transition-colors " +
                  (done.includes(c.term)
                    ? "border-border opacity-30"
                    : wrong === c.term
                      ? "border-destructive text-destructive"
                      : "border-border hover:border-foreground/40")
                }
              >
                {c.definition}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- game --------------------------------- */

function Game({ cards }: { cards: Card[] }) {
  const makeRound = () => {
    const c = cards[Math.floor(Math.random() * cards.length)]!;
    const truthy = Math.random() > 0.45;
    const other = cards[Math.floor(Math.random() * cards.length)]!;
    return { term: c.term, definition: truthy ? c.definition : other.definition, truth: truthy || other.definition === c.definition };
  };
  const [round, setRound] = useState(makeRound);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<null | boolean>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const answer = (guess: boolean) => {
    const ok = guess === round.truth;
    setFlash(ok);
    if (ok) setScore((s) => s + 1);
    else setLives((l) => l - 1);
    timer.current = window.setTimeout(() => {
      setFlash(null);
      setRound(makeRound());
    }, 450);
  };

  if (lives <= 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Game over</p>
        <p className="mt-2 font-display text-5xl font-semibold tabular-nums">{score}</p>
        <p className="mt-2 text-sm text-muted-foreground">juiste beoordelingen op rij</p>
        <button
          type="button"
          className={`${btnPrimary} mt-6`}
          onClick={() => {
            setLives(3);
            setScore(0);
            setRound(makeRound());
          }}
        >
          Opnieuw spelen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Score <span className="tabular-nums text-foreground">{score}</span>
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {"● ".repeat(lives).trim()} levens
        </span>
      </div>
      <div
        className={
          "rounded-lg border p-8 text-center transition-colors " +
          (flash === null
            ? "border-border"
            : flash
              ? "border-success"
              : "border-destructive")
        }
      >
        <p className="font-display text-2xl font-semibold">{round.term}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {round.definition}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className={btnBase} onClick={() => answer(false)}>
            Fout
          </button>
          <button type="button" className={btnPrimary} onClick={() => answer(true)}>
            Goed
          </button>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Beoordeel of de definitie bij de term hoort.
      </p>
    </div>
  );
}

/* --------------------------------- viewer -------------------------------- */

export function StudySetViewer({ cards }: { cards: Card[] }) {
  const [mode, setMode] = useState<Mode>("flashcards");

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_260px] lg:gap-12">
      <div className="min-w-0">
        <div key={mode}>
          {mode === "flashcards" && <Flashcards cards={cards} />}
          {mode === "mcq" && <Mcq cards={cards} />}
          {mode === "quiz" && <Mcq cards={cards} timed />}
          {mode === "write" && <Write cards={cards} />}
          {mode === "test" && <Test cards={cards} />}
          {mode === "match" && <Match cards={cards} />}
          {mode === "game" && <Game cards={cards} />}
        </div>

        <div className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
            <h2 className="font-display text-2xl font-semibold">Termen</h2>
            <span className="text-xs text-muted-foreground">{cards.length} kaarten</span>
          </div>
          <ul className="divide-y divide-border">
            {cards.map((c) => (
              <li key={c.term} className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                <p className="text-[15px] font-semibold">{c.term}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.definition}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
          Oefenmodi
        </h2>
        <div className="grid gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={
                "rounded-md border px-4 py-3 text-left transition-colors " +
                (mode === m.id
                  ? "border-foreground bg-secondary"
                  : "border-border hover:border-foreground/40")
              }
            >
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{m.hint}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
