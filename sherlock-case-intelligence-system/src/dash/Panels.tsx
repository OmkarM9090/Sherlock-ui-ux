import { useCallback, useEffect, useState } from "react";
import { FileText, Users, Network, Gauge, ArrowRight, FolderSearch } from "lucide-react";
import { useCountUp, useDragScroll } from "../hooks";
import { ACTIVITY, TIMELINE, evidenceById, entityName, kindLabel, neighbours, nodeById, suspectById, type TimelineEvent } from "../data/caseData";
import { Tag } from "../ui";

/* ────────────────────────────────────────────────────────────────────
   Metrics row
─────────────────────────────────────────────────────────────────── */
function MiniGraph() {
  return (
    <svg width="72" height="26" viewBox="0 0 72 26" fill="none" aria-hidden>
      <path d="M6 20 L28 8 M28 8 L48 16 M48 16 L66 6 M28 8 L34 22" stroke="#C7A76A" strokeWidth="1" opacity="0.55" />
      {[
        { x: 6, y: 20 }, { x: 28, y: 8 }, { x: 48, y: 16 }, { x: 66, y: 6 }, { x: 34, y: 22 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.6} fill="#171A1F" stroke="#C7A76A" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

export function MetricsRow() {
  const ev = useCountUp(27, true, 1400);
  const su = useCountUp(5, true, 1400);
  const cn = useCountUp(18, true, 1400);
  const conf = useCountUp(87, true, 1800);
  const [bar, setBar] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBar(true), 500);
    return () => clearTimeout(t);
  }, []);

  const C = 2 * Math.PI * 25;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* evidence */}
      <div
        data-enter
        className="group rounded-xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20"
      >
        <div className="flex items-center justify-between">
          <FileText size={19} strokeWidth={1.5} className="text-gold" />
          <span className="font-mono text-[9px] tracking-[1.5px] text-mute">CAT. 12–15 OCT</span>
        </div>
        <p className="mt-4 font-sans text-[34px] font-bold leading-none tracking-[-1px] text-ink">
          {ev}
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-[2px] text-mute">EVIDENCE COLLECTED</p>
        <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-line/60">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-1000 ease-out"
            style={{ width: bar ? "74%" : "0%" }}
          />
        </div>
        <p className="mt-2 font-mono text-[9px] tracking-[1.5px] text-mute">18 ANALYZED • 74%</p>
      </div>

      {/* suspects */}
      <div
        data-enter
        className="group rounded-xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20"
      >
        <div className="flex items-center justify-between">
          <Users size={19} strokeWidth={1.5} className="text-gold" />
          <span className="font-mono text-[9px] tracking-[1.5px] text-mute">1 PRIMARY</span>
        </div>
        <p className="mt-4 font-sans text-[34px] font-bold leading-none tracking-[-1px] text-ink">
          {String(su).padStart(2, "0")}
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-[2px] text-mute">PERSONS OF INTEREST</p>
        <div className="mt-4 flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-[11px] w-[11px] rounded-full border-[1.5px] ${
                i < 3 ? "border-gold bg-gold/20" : "border-line bg-elev"
              }`}
            />
          ))}
          <span className="ml-1 font-mono text-[9px] tracking-[1.5px] text-mute">3 ACTIVE</span>
        </div>
      </div>

      {/* connections */}
      <div
        data-enter
        className="group rounded-xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20"
      >
        <div className="flex items-center justify-between">
          <Network size={19} strokeWidth={1.5} className="text-gold" />
          <span className="font-mono text-[9px] tracking-[1.5px] text-crimson">2 CONFLICTS</span>
        </div>
        <p className="mt-4 font-sans text-[34px] font-bold leading-none tracking-[-1px] text-ink">
          {cn}
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-[2px] text-mute">CONNECTIONS MAPPED</p>
        <div className="mt-4 h-[26px]">
          <MiniGraph />
        </div>
      </div>

      {/* confidence — the star */}
      <div
        data-enter
        className="group relative overflow-hidden rounded-xl border border-gold/25 bg-surface p-6 shadow-[var(--shadow-gold)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40"
      >
        <div className="flex items-start justify-between">
          <div>
            <Gauge size={19} strokeWidth={1.5} className="text-gold" />
            <p className="mt-4 font-sans text-[34px] font-bold leading-none tracking-[-1px] text-ink">
              {conf}
              <span className="text-gold">%</span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-[2px] text-mute">CASE CONFIDENCE</p>
          </div>
          <svg width="62" height="62" viewBox="0 0 62 62" className="-mr-1 -mt-1">
            <circle cx="31" cy="31" r="25" stroke="#282B30" strokeWidth="3.5" fill="none" />
            <circle
              cx="31"
              cy="31"
              r="25"
              stroke="#C7A76A"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - conf / 100)}
              transform="rotate(-90 31 31)"
            />
          </svg>
        </div>
        <p className="mt-4 font-mono text-[9px] tracking-[1.5px] text-sage">
          ▲ CERTAINTY INCREASED +3 TODAY
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Activity / Details panel
────────────────────────────────────────────────────────────────────── */
export function ActivityPanel({
  selectedId,
  onSelect,
  onOpenEvidence,
  onTrace,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenEvidence: (id: string) => void;
  onTrace: () => void;
}) {
  const [tab, setTab] = useState<"activity" | "details">("activity");

  useEffect(() => {
    if (selectedId) setTab("details");
  }, [selectedId]);

  const node = selectedId ? nodeById(selectedId) : null;
  const ev = selectedId ? evidenceById(selectedId) : undefined;
  const su = selectedId ? suspectById(selectedId) : undefined;
  const links = selectedId ? Array.from(neighbours(selectedId)) : [];

  const dot = (tone: string) =>
    tone === "critical" ? "bg-crimson" : tone === "success" ? "bg-sage" : "bg-gold";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      {/* tabs */}
      <div className="flex items-center gap-7 border-b border-line/60 px-6 pt-4" role="tablist">
        {(["activity", "details"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative pb-3.5 font-sans text-[12px] font-medium tracking-[2px] transition-colors duration-200 after:absolute after:bottom-[-1px] after:left-0 after:h-[2px] after:bg-gold after:transition-all after:duration-300 ${
              tab === t ? "text-ink after:w-full" : "text-mute after:w-0 hover:text-ink"
            }`}
          >
            {t === "activity" ? "RECENT ACTIVITY" : "EVIDENCE DETAILS"}
          </button>
        ))}
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {tab === "activity" ? (
          <ul>
            {ACTIVITY.map((a, i) => (
              <li
                key={i}
                className={`flex gap-4 py-3.5 ${i < ACTIVITY.length - 1 ? "border-b border-line/50" : ""}`}
              >
                <span className={`mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full ${dot(a.tone)}`} />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-[1.5px] text-mute">{a.time}</p>
                  <p className="mt-1 font-sans text-[13.5px] font-medium text-ink">{a.title}</p>
                  <p className="mt-0.5 font-sans text-[12.5px] leading-snug text-mute">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : !selectedId ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <span className="pulse-dot h-2 w-2 rounded-full bg-gold" />
            <p className="mt-5 font-sans text-[14px] font-medium text-ink">
              Select a node on the map
            </p>
            <p className="mt-2 max-w-[240px] font-sans text-[13px] leading-relaxed text-mute">
              The investigation awaits its first clue.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-mono text-[11px] tracking-[2px] text-gold">{selectedId}</p>
            <h4 className="mt-2 font-sans text-[19px] font-semibold text-ink">
              {ev?.title ?? su?.name ?? node?.name}
            </h4>

            <div className="mt-4 flex flex-wrap gap-2">
              <Tag tone={su?.role === "PRIMARY SUSPECT" ? "red" : "gold"}>
                {su?.role ?? node?.sub ?? "RECORD"}
              </Tag>
              {ev && <Tag tone="mute">{ev.confidence}% CONFIDENCE</Tag>}
              {su && <Tag tone="mute">{su.connectionCount} CONNECTIONS</Tag>}
            </div>

            <p className="mt-4 font-sans text-[13.5px] leading-[1.7] text-mute">
              {ev?.description ?? su?.description ?? `Entity registered on the case board with ${links.length} mapped connection${links.length === 1 ? "" : "s"}.`}
            </p>

            {links.length > 0 && (
              <div className="mt-5">
                <p className="font-mono text-[10px] tracking-[2px] text-mute">LINKED TO</p>
                <ul className="mt-2 space-y-1">
                  {links.slice(0, 6).map((id) => (
                    <li key={id}>
                      <button
                        onClick={() =>
                          evidenceById(id) ? onOpenEvidence(id) : onSelect(id)
                        }
                        className="group flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left font-sans text-[13px] text-mute transition-colors hover:text-gold2"
                      >
                        <ArrowRight size={12} strokeWidth={1.75} className="text-gold/70 transition-transform group-hover:translate-x-0.5" />
                        {entityName(id)}
                        <span className="ml-auto font-mono text-[9px] tracking-[1px] text-mute/60">
                          {kindLabel(id)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {ev && (
                <button
                  onClick={() => onOpenEvidence(ev.id)}
                  className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-sans text-[11px] font-medium tracking-[1.5px] text-mute transition-colors duration-300 hover:border-gold/40 hover:text-ink"
                >
                  <FolderSearch size={13} strokeWidth={1.75} />
                  OPEN FULL FILE
                </button>
              )}
              <button
                onClick={onTrace}
                className="flex items-center gap-2 rounded-lg border border-gold px-4 py-2 font-sans text-[11px] font-medium tracking-[1.5px] text-gold transition-colors duration-300 hover:bg-gold hover:text-bg"
              >
                TRACE CONNECTIONS
                <ArrowRight size={13} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Timeline strip (drag to scroll)
────────────────────────────────────────────────────────────────────── */
export function TimelineStrip({ onPick }: { onPick: (t: TimelineEvent) => void }) {
  const { ref, wasDragged } = useDragScroll<HTMLDivElement>();
  const pick = useCallback(
    (t: TimelineEvent) => {
      if (wasDragged()) return;
      onPick(t);
    },
    [onPick, wasDragged]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line/60 px-6 py-4">
        <h3 className="font-sans text-[15px] font-semibold tracking-[0.5px] text-ink">
          INVESTIGATION TIMELINE
        </h3>
        <span className="font-mono text-[10px] tracking-[1.5px] text-mute">
          14 OCT 1897 — 15 OCT 1897 • DRAG TO SCRUB
        </span>
      </div>
      <div
        ref={ref}
        className="thin-scroll cursor-grab select-none overflow-x-auto active:cursor-grabbing"
      >
        <div className="relative flex min-w-max items-stretch gap-0 px-8 pb-7 pt-6">
          {/* the line */}
          <div className="absolute left-8 right-8 top-[42px] h-px bg-line" />
          {TIMELINE.map((t) => {
            const current = t.id === "T-06";
            return (
              <button
                key={t.id}
                onClick={() => pick(t)}
                className="group relative flex w-[148px] shrink-0 flex-col items-center pt-1 text-center"
              >
                <span
                  className={`font-mono text-[11px] tracking-[1px] ${
                    t.critical ? "text-crimson" : "text-gold"
                  }`}
                >
                  {t.time}
                </span>
                <span className="relative mt-1.5 flex h-[22px] items-center">
                  {current && (
                    <span className="case-ring absolute h-[20px] w-[20px] rounded-full border border-crimson/60" />
                  )}
                  <span
                    className={`relative h-[11px] w-[11px] rounded-full border-2 bg-surface transition-colors duration-200 ${
                      t.critical
                        ? "border-crimson group-hover:bg-crimson"
                        : "border-gold group-hover:bg-gold"
                    }`}
                  />
                </span>
                <span className="mt-2 px-1 font-sans text-[12px] leading-snug text-ink/85 transition-colors duration-200 group-hover:text-ink">
                  {t.event}
                </span>
                <span className="mt-1.5 font-mono text-[8.5px] tracking-[1.5px] text-mute/70">
                  {t.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
