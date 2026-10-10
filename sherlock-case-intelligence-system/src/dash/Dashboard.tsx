import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Search, Bell } from "lucide-react";
import Sidebar, { type DashView } from "./Sidebar";
import Graph from "./Graph";
import { MetricsRow, ActivityPanel, TimelineStrip } from "./Panels";
import { CasesView, EvidenceView, SuspectsView, TimelineView } from "./Views";
import Thread from "./Thread";
import EvidenceModal from "./EvidenceModal";
import Deduction from "./Deduction";
import { CONTRADICTIONS, evidenceById, type TimelineEvent } from "../data/caseData";
import { GoldButton, Tag, useToast } from "../ui";
import { useReducedMotion } from "../hooks";

const VIEW_LABEL: Record<DashView, string> = {
  overview: "CASE OVERVIEW",
  cases: "CASE REGISTRY",
  evidence: "EVIDENCE ARCHIVE",
  suspects: "PERSONS & DOSSIERS",
  timeline: "CHRONOLOGY OF EVENTS",
  connections: "CONSTITUTION OF THE CASE",
};

export default function Dashboard({ onExit }: { onExit: () => void }) {
  const toast = useToast();
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement | null>(null);
  const viewWrap = useRef<HTMLDivElement | null>(null);
  const firstView = useRef(true);

  const [view, setView] = useState<DashView>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalEvidence, setModalEvidence] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [deductionOpen, setDeductionOpen] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [query, setQuery] = useState("");

  /* ── grand entrance ─────────────────────────────────────────── */
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(q("[data-side]"), { x: -260 }, { x: 0, duration: 0.55 })
        .fromTo(
          q("[data-top] > *"),
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.09 },
          0.2
        )
        .fromTo(
          q("[data-enter]"),
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.09 },
          0.35
        );
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  /* ── view switching ─────────────────────────────────────────── */
  const navigate = useCallback((v: DashView) => {
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    if (reduced || !viewWrap.current) return;
    gsap.fromTo(
      viewWrap.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, [view, reduced]);

  /* ── actions ────────────────────────────────────────────────── */
  const pickTimeline = useCallback(
    (t: TimelineEvent) => {
      const target = t.connected.find((c) => !!c) ?? "CASE";
      setSelectedId(target);
      toast({
        tone: t.critical ? "red" : "info",
        title: `${t.time} — ${t.event}`,
        detail: t.critical
          ? "Critical event — thread identified on the case board."
          : "Cross-referenced on the case board.",
      });
    },
    [toast]
  );

  const resolveCase = useCallback(() => {
    setResolved(true);
    toast({
      tone: "gold",
      title: "Case resolved.",
      detail: "Deduction confirmed and filed under SH-2048.",
    });
  }, [toast]);

  const startThread = useCallback(() => setThreadOpen(true), []);

  return (
    <div ref={root} className="min-h-screen bg-bg">
      <Sidebar
        view={view}
        onNavigate={navigate}
        onIntelligence={() => setDeductionOpen(true)}
        onSettings={() =>
          toast({ tone: "info", title: "Archives settings", detail: "Preferences are sealed within this dossier." })
        }
        onExit={onExit}
        resolved={resolved}
      />

      {/* mobile top strip */}
      <div className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-lg lg:hidden">
        <div className="thin-scroll flex items-center gap-1.5 overflow-x-auto px-4 py-2.5">
          <span className="mr-2 font-display text-[16px] font-semibold tracking-[2px] text-gold">
            SH
          </span>
          {(
            [
              ["overview", "OVERVIEW"],
              ["cases", "CASES"],
              ["evidence", "EVIDENCE"],
              ["suspects", "SUSPECTS"],
              ["timeline", "TIMELINE"],
              ["connections", "CONNECTIONS"],
            ] as [DashView, string][]
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => navigate(v)}
              className={`shrink-0 rounded-md px-3 py-1.5 font-sans text-[11px] font-medium tracking-[1.5px] transition-colors ${
                view === v ? "bg-gold/10 text-gold" : "text-mute hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={onExit}
            className="ml-auto shrink-0 rounded-md border border-line px-3 py-1.5 font-mono text-[10px] tracking-[1.5px] text-mute"
          >
            EXIT
          </button>
        </div>
      </div>

      {/* main column */}
      <div className="lg:pl-[260px]">
        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 lg:px-12 lg:pt-9">
          {/* ── top bar ── */}
          <div data-top className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="font-sans text-[26px] font-semibold tracking-[-0.5px] text-ink lg:text-[28px]">
                  THE BLACKWOOD AFFAIR
                </h1>
                <Tag tone={resolved ? "green" : "gold"} className="mt-1">
                  {resolved ? "RESOLVED" : "ACTIVE"}
                </Tag>
              </div>
              <p className="mt-2 font-mono text-[11px] tracking-[1.5px] text-mute">
                CASE #SH-2048 • OPENED 12 OCT 1897 • {VIEW_LABEL[view]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search
                  size={15}
                  strokeWidth={1.6}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate("evidence");
                      toast({
                        tone: "info",
                        title: "Archive refined",
                        detail: query.trim()
                          ? `Records matching “${query.trim()}”.`
                          : "Full archive restored.",
                      });
                    }
                  }}
                  placeholder="Search the case..."
                  aria-label="Search the case"
                  className="w-[240px] rounded-lg border border-line bg-surface py-2.5 pl-10 pr-4 font-sans text-[13.5px] text-ink placeholder:text-mute/70 transition-all duration-300 focus:border-gold focus:shadow-[0_0_0_3px_rgba(199,167,106,0.12)] focus:outline-none lg:w-[280px]"
                />
              </div>
              <button
                aria-label="Dispatches"
                onClick={() =>
                  toast({ tone: "info", title: "No new dispatches", detail: "The trail is quiet, detective." })
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-mute transition-colors duration-200 hover:border-gold/30 hover:text-ink"
              >
                <Bell size={16} strokeWidth={1.6} />
              </button>
              <GoldButton onClick={startThread} magnetic className="hidden sm:inline-flex">
                Connect Evidence
              </GoldButton>
            </div>
          </div>

          {/* ── views ── */}
          <div ref={viewWrap} className="mt-8">
            {view === "overview" && (
              <div className="space-y-6">
                <MetricsRow />
                <div data-enter className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <div className="min-h-[420px]">
                    <Graph
                      animate
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onExpand={() => navigate("connections")}
                    />
                  </div>
                  <div className="min-h-[420px]">
                    <ActivityPanel
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onOpenEvidence={setModalEvidence}
                      onTrace={startThread}
                    />
                  </div>
                </div>
                <div data-enter>
                  <TimelineStrip onPick={pickTimeline} />
                </div>
              </div>
            )}

            {view === "cases" && (
              <CasesView
                onOpenActive={() => navigate("overview")}
                onSealed={(id) =>
                  toast({
                    tone: "info",
                    title: "Sealed archive",
                    detail: `File ${id} is beyond the remit of this enquiry.`,
                  })
                }
              />
            )}

            {view === "evidence" && <EvidenceView query={query} onOpen={setModalEvidence} />}

            {view === "suspects" && (
              <SuspectsView
                onInspect={(id) => {
                  setSelectedId(id);
                  navigate("connections");
                  toast({ tone: "gold", title: "Profile pinned to board", detail: "Connections mapped to this person." });
                }}
              />
            )}

            {view === "timeline" && <TimelineView onPick={pickTimeline} />}

            {view === "connections" && (
              <div data-enter className="space-y-6">
                <Graph
                  animate
                  compact={false}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  title="CONSTITUTION OF THE CASE"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  {CONTRADICTIONS.map((c) => (
                    <div
                      key={c.id}
                      data-spotlight
                      className="spotlight-card spotlight-card--alert rounded-xl border border-line border-l-[3px] border-l-crimson bg-surface p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] tracking-[2px] text-crimson">
                          {c.id} • DISCREPANCY DETECTED
                        </span>
                        <span className="font-mono text-[9px] tracking-[1.5px] text-mute">
                          {c.significance.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-3 font-sans text-[13.5px] leading-[1.7] text-mute">
                        {c.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── overlays ── */}
      {threadOpen && (
        <Thread
          onClose={() => setThreadOpen(false)}
          onDeduce={() => {
            setThreadOpen(false);
            setTimeout(() => setDeductionOpen(true), 160);
          }}
        />
      )}

      {modalEvidence && evidenceById(modalEvidence) && (
        <EvidenceModal
          id={modalEvidence}
          onClose={() => setModalEvidence(null)}
          onNavigate={(id) => setModalEvidence(id)}
          onEntity={(id) => {
            setModalEvidence(null);
            setSelectedId(id);
            toast({ tone: "info", title: "Entity pinned to board", detail: `${id} highlighted on the case board.` });
          }}
          onTrace={() => {
            setModalEvidence(null);
            setTimeout(() => setThreadOpen(true), 160);
          }}
        />
      )}

      {deductionOpen && (
        <Deduction
          resolved={resolved}
          onClose={() => setDeductionOpen(false)}
          onResolve={resolveCase}
          onOpenEvidence={(id) => {
            setDeductionOpen(false);
            setTimeout(() => setModalEvidence(id), 160);
          }}
        />
      )}
    </div>
  );
}
