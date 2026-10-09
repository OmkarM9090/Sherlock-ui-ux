import { ArrowRight, ArrowUpRight, FileSearch, Pin } from "lucide-react";
import {
  EVIDENCE,
  SUSPECTS,
  TIMELINE,
  evidenceById,
  type TimelineEvent,
} from "../data/caseData";
import { Tag } from "../ui";

/* ────────────────────────────────────────────────────────────────────
   CASES — the registry
────────────────────────────────────────────────────────────────────── */
const REGISTRY = [
  { id: "SH-2048", title: "THE BLACKWOOD AFFAIR", opened: "12 OCT 1897", status: "ACTIVE" as const, conf: 87 },
  { id: "SH-2047", title: "THE ADLER CORRESPONDENCE", opened: "02 MAR 1895", status: "RESOLVED" as const, conf: 99 },
  { id: "SH-2041", title: "THE BERYL CORONET", opened: "19 NOV 1893", status: "RESOLVED" as const, conf: 100 },
  { id: "SH-2033", title: "THE NAVAL TREATY", opened: "07 JUN 1891", status: "SEALED" as const, conf: 0 },
];

export function CasesView({
  onOpenActive,
  onSealed,
}: {
  onOpenActive: () => void;
  onSealed: (id: string) => void;
}) {
  return (
    <div data-enter className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line/60 px-7 py-5">
        <h3 className="font-sans text-[15px] font-semibold text-ink">CASE REGISTRY</h3>
        <span className="font-mono text-[10px] tracking-[2px] text-mute">
          4 FILES • 1 ACTIVE
        </span>
      </div>
      <ul>
        {REGISTRY.map((c, i) => {
          const active = c.status === "ACTIVE";
          return (
            <li key={c.id}>
              <button
                onClick={() => (active ? onOpenActive() : onSealed(c.id))}
                className={`group flex w-full flex-wrap items-center gap-x-8 gap-y-2 px-7 py-6 text-left transition-colors duration-200 hover:bg-white/[0.02] ${
                  i < REGISTRY.length - 1 ? "border-b border-line/50" : ""
                } ${active ? "bg-gold/[0.04]" : ""}`}
              >
                <span className="flex items-center gap-3 font-mono text-[12px] tracking-[1.5px] text-gold">
                  {active && <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-gold" />}
                  {c.id}
                </span>
                <span className="min-w-[220px] flex-1 font-sans text-[15.5px] font-semibold tracking-[0.5px] text-ink">
                  {c.title}
                </span>
                <span className="hidden font-mono text-[10px] tracking-[1.5px] text-mute md:block">
                  OPENED {c.opened}
                </span>
                <Tag tone={active ? "gold" : c.status === "RESOLVED" ? "green" : "mute"}>
                  {c.status}
                </Tag>
                {c.conf > 0 && (
                  <span className="hidden font-mono text-[11px] tracking-[1px] text-mute lg:block">
                    {c.conf}%
                  </span>
                )}
                <ArrowUpRight
                  size={15}
                  strokeWidth={1.6}
                  className="text-mute transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gold"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   EVIDENCE — the archive grid
────────────────────────────────────────────────────────────────────── */
export function EvidenceView({
  query,
  onOpen,
}: {
  query: string;
  onOpen: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const list = EVIDENCE.filter(
    (e) =>
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
  );

  return (
    <div data-enter>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[2px] text-mute">
          {q ? `ARCHIVE REFINED — ` : ""}{list.length} OF {EVIDENCE.length} RECORDS
        </p>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface py-24 text-center">
          <FileSearch size={22} strokeWidth={1.4} className="text-mute" />
          <p className="mt-5 font-display text-[26px] italic text-mute">No trace found.</p>
          <p className="mt-2 font-sans text-[13px] text-mute/70">
            The investigation awaits its first clue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => onOpen(e.id)}
              className="group overflow-hidden rounded-xl border border-line bg-surface text-left shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-[var(--shadow-elev)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-elev">
                {e.img ? (
                  <img
                    src={e.img}
                    alt={e.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    <FileSearch size={26} strokeWidth={1.2} className="text-mute/50" />
                    <span className="font-mono text-[9px] tracking-[2px] text-mute/60">
                      PHOTOGRAPHIC PLATE PENDING
                    </span>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded bg-bg/70 px-2 py-1 font-mono text-[9px] tracking-[1.5px] text-ink/90 backdrop-blur-sm">
                  {e.exhibit}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-sans text-[16px] font-semibold text-ink">{e.title}</h4>
                  <Tag tone="gold" className="shrink-0">
                    {e.confidence}%
                  </Tag>
                </div>
                <p className="mt-1.5 font-mono text-[10.5px] tracking-[1px] text-mute">
                  {e.id} • {e.type} • {e.discovered}
                </p>
                <p className="mt-3 line-clamp-2 font-sans text-[13px] leading-relaxed text-mute">
                  {e.description}
                </p>
                <p className="mt-4 flex items-center gap-2 font-sans text-[11px] font-medium tracking-[1.5px] text-gold">
                  OPEN FILE
                  <ArrowRight size={12} strokeWidth={1.75} className="transition-transform duration-300 group-hover:translate-x-1" />
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   SUSPECTS — dossiers
────────────────────────────────────────────────────────────────────── */
export function SuspectsView({ onInspect }: { onInspect: (id: string) => void }) {
  return (
    <div data-enter className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {SUSPECTS.map((s) => (
        <article
          key={s.id}
          className="group flex flex-col rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/25"
        >
          <div className="flex items-start justify-between">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 font-display text-[18px] font-semibold ${
                s.role === "PRIMARY SUSPECT"
                  ? "border-crimson/60 text-crimson"
                  : "border-line text-gold"
              } bg-elev`}
            >
              {s.initials}
            </span>
            <Tag
              tone={
                s.role === "PRIMARY SUSPECT"
                  ? "red"
                  : s.status === "COOPERATIVE"
                    ? "green"
                    : s.role === "UNIDENTIFIED"
                      ? "mute"
                      : "gold"
              }
            >
              {s.role}
            </Tag>
          </div>
          <h4 className="mt-4 font-sans text-[18px] font-semibold text-ink">{s.name}</h4>
          <p className="mt-1 font-mono text-[10px] tracking-[1.5px] text-mute">{s.lastSeen}</p>
          <p className="mt-3 flex-1 font-sans text-[13.5px] leading-[1.7] text-mute">
            {s.description}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
            <span className="font-mono text-[10px] tracking-[1.5px] text-gold">
              {s.connectionCount} CONNECTIONS
            </span>
            <button
              onClick={() => onInspect(s.id)}
              className="flex items-center gap-2 font-sans text-[11px] font-medium tracking-[1.5px] text-mute transition-colors duration-200 hover:text-gold2"
            >
              <Pin size={12} strokeWidth={1.75} />
              PIN TO BOARD
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   TIMELINE — full ledger view
────────────────────────────────────────────────────────────────────── */
export function TimelineView({ onPick }: { onPick: (t: TimelineEvent) => void }) {
  return (
    <div data-enter className="relative mx-auto max-w-[860px]">
      <div className="absolute bottom-2 left-[52px] top-2 w-px bg-line" />
      <ul className="space-y-3">
        {TIMELINE.map((t) => (
          <li key={t.id} className="relative">
            <button
              onClick={() => onPick(t)}
              className="group flex w-full items-start gap-6 rounded-xl border border-transparent p-4 text-left transition-all duration-200 hover:border-line hover:bg-surface"
            >
              <span
                className={`w-[72px] shrink-0 pt-0.5 text-right font-mono text-[13px] tracking-[1px] ${
                  t.critical ? "text-crimson" : "text-gold"
                }`}
              >
                {t.time}
              </span>
              <span
                className={`mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 bg-bg ${
                  t.critical ? "border-crimson" : "border-gold"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-3">
                  <span className="font-sans text-[15px] font-semibold text-ink">{t.event}</span>
                  <Tag tone={t.critical ? "red" : "mute"}>{t.type}</Tag>
                </span>
                {t.connected.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-2">
                    {t.connected.map((id) => (
                      <span
                        key={id}
                        className="rounded border border-line bg-elev px-1.5 py-0.5 font-mono text-[9px] tracking-[1px] text-mute"
                      >
                        {id} {evidenceById(id) ? `· ${evidenceById(id)!.title.toUpperCase()}` : ""}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <ArrowRight
                size={15}
                strokeWidth={1.6}
                className="mt-1 shrink-0 text-mute opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-gold group-hover:opacity-100"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
