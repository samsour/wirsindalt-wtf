"use client";

import { useState, useEffect } from "react";

const VOTED_KEY = "wirsindalt_voted";
const RSVP_KEY = "wirsindalt_rsvp";

type DateOption = { id: string; date: string; label: string | null; voteCount: number };
type RsvpCounts = { attending: number; maybe: number; not_attending: number };
type EventData = {
  name: string;
  description: string | null;
  finalDateOptionId: string | null;
  location: string | null;
  time: string | null;
  rsvpsEnabled: boolean;
  dateOptions: DateOption[];
  rsvpCounts: RsvpCounts;
};

export default function HomePage() {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setHasVoted(!!localStorage.getItem(VOTED_KEY));
    setRsvpStatus(localStorage.getItem(RSVP_KEY));
    fetchEvent();
  }, []);

  async function fetchEvent() {
    const res = await fetch("/api/event");
    if (res.ok) setEventData(await res.json());
  }

  function toggleDate(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submitVote(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || selected.size === 0) return;
    setSubmitting(true);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterName: name.trim(), dateOptionIds: [...selected] }),
    });
    if (res.ok) {
      localStorage.setItem(VOTED_KEY, "1");
      setHasVoted(true);
      setSubmitted(true);
      fetchEvent();
    }
    setSubmitting(false);
  }

  async function submitRsvp(status: string) {
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), status }),
    });
    if (res.ok) {
      localStorage.setItem(RSVP_KEY, status);
      setRsvpStatus(status);
      fetchEvent();
    }
    setSubmitting(false);
  }

  if (!eventData) {
    return <div className="text-center pt-32 label text-ink-faint">Laden…</div>;
  }

  const finalOption = eventData.dateOptions.find((d) => d.id === eventData.finalDateOptionId);
  const sorted = [...eventData.dateOptions].sort((a, b) => b.voteCount - a.voteCount);
  const maxVotes = sorted[0]?.voteCount ?? 1;

  return (
    <div className="mx-auto max-w-[640px] px-6 pt-16 pb-32">
      {/* Hero */}
      <div className="text-center mb-14">
        <p className="label mb-4">Abitur 2016 · CvSS</p>
        <h1 className="font-serif font-normal text-[clamp(40px,6vw,72px)] leading-none tracking-[-0.03em] mb-5">
          <em className="italic text-accent">Bääm!</em> Terminplanung
        </h1>
        {eventData.description && (
          <p className="text-ink-muted text-lg max-w-[420px] mx-auto">{eventData.description}</p>
        )}
        {!eventData.description && !finalOption && (
          <p className="text-ink-muted text-lg max-w-[420px] mx-auto">
            10 Jahre. Zeit für eine Party. Stimm ab, wann du kannst — dann planen wir.
          </p>
        )}
      </div>

      <Steps active={finalOption ? 1 : 0} />

      {finalOption ? (
        <EventPage
          event={eventData}
          finalOption={finalOption}
          rsvpStatus={rsvpStatus}
          name={name}
          setName={setName}
          onRsvp={submitRsvp}
          submitting={submitting}
        />
      ) : eventData.dateOptions.length === 0 ? (
        <p className="text-center text-ink-muted">Termine werden bald bekannt gegeben.</p>
      ) : hasVoted ? (
        <Results options={sorted} maxVotes={maxVotes} submitted={submitted} />
      ) : (
        <VoteForm
          options={eventData.dateOptions}
          name={name}
          setName={setName}
          selected={selected}
          toggleDate={toggleDate}
          onSubmit={submitVote}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ─── Event page (final date set) ───

function EventPage({
  event: ev, finalOption, rsvpStatus, name, setName, onRsvp, submitting,
}: {
  event: EventData;
  finalOption: DateOption;
  rsvpStatus: string | null;
  name: string;
  setName: (v: string) => void;
  onRsvp: (status: string) => void;
  submitting: boolean;
}) {
  const d = new Date(finalOption.date + "T12:00:00");

  return (
    <div className="space-y-6">
      {/* Date card */}
      <div className="bg-ink text-bg rounded-2xl p-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-5">Der Termin</p>
        <div className="font-serif text-[clamp(48px,8vw,80px)] leading-none tracking-tight mb-2">
          {d.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
        </div>
        <div className="text-white/60 text-lg mb-5">
          {d.toLocaleDateString("de-DE", { weekday: "long" })}, {d.getFullYear()}
        </div>
        <div className="flex justify-center gap-6 text-sm text-white/50">
          {ev.time && (
            <span className="flex items-center gap-1.5">
              <ClockIcon /> {ev.time} Uhr
            </span>
          )}
          {ev.location && (
            <span className="flex items-center gap-1.5">
              <PinIcon /> {ev.location}
            </span>
          )}
        </div>
        {finalOption.label && <p className="mt-4 text-accent-mid font-medium">{finalOption.label}</p>}
      </div>

      {/* Countdown */}
      <Countdown targetDate={finalOption.date} />

      {/* RSVP */}
      {ev.rsvpsEnabled && (
        <div className="bg-surface border border-line rounded-xl p-6">
          {rsvpStatus ? (
            <RsvpConfirmation status={rsvpStatus} counts={ev.rsvpCounts} />
          ) : (
            <RsvpForm name={name} setName={setName} onRsvp={onRsvp} submitting={submitting} />
          )}
        </div>
      )}

      {/* Attendance counts (always visible once RSVPs are open) */}
      {ev.rsvpsEnabled && (
        <AttendanceSummary counts={ev.rsvpCounts} />
      )}
    </div>
  );
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { value: timeLeft.days, label: "Tage" },
        { value: timeLeft.hours, label: "Stunden" },
        { value: timeLeft.minutes, label: "Minuten" },
        { value: timeLeft.seconds, label: "Sekunden" },
      ].map(({ value, label }) => (
        <div key={label} className="bg-surface border border-line rounded-xl py-4">
          <div className="font-serif text-[36px] leading-none tracking-tight">{String(value).padStart(2, "0")}</div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-ink-muted mt-1.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

function calcTimeLeft(dateStr: string) {
  const diff = new Date(dateStr + "T12:00:00").getTime() - Date.now();
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function RsvpForm({ name, setName, onRsvp, submitting }: {
  name: string;
  setName: (v: string) => void;
  onRsvp: (status: string) => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl tracking-tight">Bist du dabei?</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Name"
        className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
      />
      <div className="grid grid-cols-3 gap-2">
        <RsvpButton label="Ich bin dabei! 🎉" status="attending" disabled={!name.trim() || submitting} onClick={onRsvp} primary />
        <RsvpButton label="Vielleicht" status="maybe" disabled={!name.trim() || submitting} onClick={onRsvp} />
        <RsvpButton label="Leider nicht" status="not_attending" disabled={!name.trim() || submitting} onClick={onRsvp} />
      </div>
    </div>
  );
}

function RsvpButton({ label, status, disabled, onClick, primary }: {
  label: string; status: string; disabled: boolean; onClick: (s: string) => void; primary?: boolean;
}) {
  return (
    <button
      onClick={() => onClick(status)}
      disabled={disabled}
      className={`py-3 px-3 rounded-[10px] border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
        primary ? "bg-ink text-bg border-ink hover:bg-ink/80" : "bg-surface border-line-strong hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

function RsvpConfirmation({ status, counts }: { status: string; counts: RsvpCounts }) {
  const messages: Record<string, string> = {
    attending: "Du bist dabei! Wir freuen uns auf dich. 🎉",
    maybe: "Alles klar — vielleicht sehen wir uns!",
    not_attending: "Schade! Nächstes Mal vielleicht.",
  };
  return (
    <div>
      <p className="font-medium mb-1">{messages[status]}</p>
      <p className="text-sm text-ink-muted">
        Bisher: {counts.attending} dabei · {counts.maybe} vielleicht · {counts.not_attending} nicht dabei
      </p>
    </div>
  );
}

function AttendanceSummary({ counts }: { counts: RsvpCounts }) {
  const total = counts.attending + counts.maybe + counts.not_attending;
  if (total === 0) return null;
  return (
    <div className="flex gap-4 px-1">
      <Stat value={counts.attending} label="Dabei" accent />
      <Stat value={counts.maybe} label="Vielleicht" />
      <Stat value={counts.not_attending} label="Nicht dabei" />
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-serif text-3xl tracking-tight ${accent ? "text-accent" : "text-ink-muted"}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">{label}</div>
    </div>
  );
}

// ─── Voting phase ───

function VoteForm({ options, name, setName, selected, toggleDate, onSubmit, submitting }: {
  options: DateOption[];
  name: string;
  setName: (v: string) => void;
  selected: Set<string>;
  toggleDate: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <label className="label block mb-2.5">Dein Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="z.B. Max Mustermann"
          className="w-full px-4 py-3.5 text-base bg-surface border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
        />
      </div>
      <div>
        <label className="label block mb-3">
          Wann kannst du?{" "}
          <span className="text-ink-faint font-normal normal-case">(mehrere möglich)</span>
        </label>
        <div className="space-y-2">
          {options.map((opt) => {
            const d = new Date(opt.date + "T12:00:00");
            const checked = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleDate(opt.id)}
                className={`w-full text-left px-5 py-4 rounded-[10px] border transition flex items-center justify-between group ${
                  checked ? "bg-ink text-bg border-ink" : "bg-surface border-line-strong hover:border-ink"
                }`}
              >
                <div>
                  <div className="font-medium">
                    {d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                  {opt.label && (
                    <div className={`text-xs mt-0.5 ${checked ? "text-white/60" : "text-ink-muted"}`}>{opt.label}</div>
                  )}
                </div>
                <span className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition ${
                  checked ? "bg-white border-white" : "border-line-strong group-hover:border-ink"
                }`}>
                  {checked && <CheckIcon />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="submit"
        disabled={!name.trim() || selected.size === 0 || submitting}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Wird gespeichert…" : "Abstimmen →"}
      </button>
    </form>
  );
}

function Results({ options, maxVotes, submitted }: { options: DateOption[]; maxVotes: number; submitted: boolean }) {
  return (
    <div className="space-y-6">
      {submitted && (
        <div className="bg-accent-soft text-accent rounded-[10px] px-5 py-4 text-sm font-medium">
          Danke! Deine Stimme wurde gezählt.
        </div>
      )}
      <div>
        <h2 className="font-serif text-2xl tracking-tight mb-5">Aktuelle Ergebnisse</h2>
        <div className="space-y-3">
          {options.map((opt, i) => {
            const d = new Date(opt.date + "T12:00:00");
            const ratio = maxVotes > 0 ? opt.voteCount / maxVotes : 0;
            return (
              <div key={opt.id} className="bg-surface border border-line rounded-[10px] px-5 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <span className="font-medium">
                      {d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    {opt.label && <span className="text-xs text-ink-muted ml-2">{opt.label}</span>}
                    {i === 0 && opt.voteCount > 0 && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider bg-accent-soft text-accent px-1.5 py-0.5 rounded-full">
                        Führend
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-medium">{opt.voteCount}</span>
                </div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Steps ───

const STEPS = [
  { label: "Wann?", description: "Stimmt ab, wann ihr könnt" },
  { label: "Party! 🎉", description: "Termin steht — jetzt zusagen" },
];

function Steps({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors ${
                done ? "bg-accent text-bg" : current ? "bg-ink text-bg" : "bg-line text-ink-muted"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-medium leading-none ${current ? "text-ink" : done ? "text-accent" : "text-ink-muted"}`}>
                  {step.label}
                </div>
                <div className="text-[11px] text-ink-faint mt-0.5 leading-none hidden sm:block">{step.description}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-4 transition-colors ${done ? "bg-accent" : "bg-line"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Icons ───

function CheckIcon() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
      <path d="M1 4L4.5 7.5L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
      <path d="M5.5 1C3.015 1 1 3.015 1 5.5c0 3.375 4.5 8 4.5 8s4.5-4.625 4.5-8C10 3.015 7.985 1 5.5 1Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
