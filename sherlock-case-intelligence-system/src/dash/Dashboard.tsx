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
import CaseSolvedOverlay from "./CaseSolvedOverlay";
import { CONTRADICTIONS, evidenceById, type TimelineEvent, EVIDENCE, SUSPECTS, NODES, EDGES } from "../data/caseData";
import { GoldButton, GhostButton, Tag, useToast } from "../ui";
import { useReducedMotion } from "../hooks";

const VIEW_LABEL: Record<DashView, string> = {
  overview: "CASE OVERVIEW",
  cases: "CASE REGISTRY",
  evidence: "EVIDENCE ARCHIVE",
  suspects: "PERSONS & DOSSIERS",
  timeline: "CHRONOLOGY OF EVENTS",
  connections: "CONSTITUTION OF THE CASE",
};

function AddEvidenceModal({ onClose, onAdd }: { onClose: () => void, onAdd: (title: string, desc: string) => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 font-sans text-[18px] font-semibold tracking-[0.5px] text-ink">Add Evidence</h3>
        <input 
          className="mb-4 w-full rounded-lg border border-line bg-elev px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-gold" 
          placeholder="Evidence Title" 
          value={title} onChange={e => setTitle(e.target.value)} 
          autoFocus
        />
        <textarea 
          className="mb-6 w-full rounded-lg border border-line bg-elev px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-gold" 
          placeholder="Description" 
          rows={3} 
          value={desc} onChange={e => setDesc(e.target.value)} 
        />
        <div className="flex justify-end gap-3">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GoldButton onClick={() => onAdd(title, desc)}>Save Evidence</GoldButton>
        </div>
      </div>
    </div>
  )
}

function AddSuspectModal({ onClose, onAdd }: { onClose: () => void, onAdd: (name: string, desc: string, role: string) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [role, setRole] = useState("");
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 font-sans text-[18px] font-semibold tracking-[0.5px] text-ink">Add Suspect</h3>
        <input 
          className="mb-4 w-full rounded-lg border border-line bg-elev px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-gold" 
          placeholder="Full Name" 
          value={name} onChange={e => setName(e.target.value)} 
          autoFocus
        />
        <input 
          className="mb-4 w-full rounded-lg border border-line bg-elev px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-gold" 
          placeholder="Role (e.g. PERSON OF INTEREST)" 
          value={role} onChange={e => setRole(e.target.value)} 
        />
        <textarea 
          className="mb-6 w-full rounded-lg border border-line bg-elev px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-gold" 
          placeholder="Description" 
          rows={3} 
          value={desc} onChange={e => setDesc(e.target.value)} 
        />
        <div className="flex justify-end gap-3">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GoldButton onClick={() => onAdd(name, desc, role)}>Save Suspect</GoldButton>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ onExit }: { onExit: () => void }) {
  const toast = useToast();
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement | null>(null);
  const viewWrap = useRef<HTMLDivElement | null>(null);
  const firstView = useRef(true);
  const [version, setVersion] = useState(0);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showAddSuspect, setShowAddSuspect] = useState(false);
  const [view, setView] = useState<DashView>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDeleteNode = () => {
    if (!selectedId || selectedId === "CASE") return;

    const nodeIdx = NODES.findIndex((n) => n.id === selectedId);
    if (nodeIdx > -1) NODES.splice(nodeIdx, 1);

    for (let i = EDGES.length - 1; i >= 0; i--) {
      if (EDGES[i].a === selectedId || EDGES[i].b === selectedId) {
        EDGES.splice(i, 1);
      }
    }

    const evIdx = EVIDENCE.findIndex((e) => e.id === selectedId);
    if (evIdx > -1) EVIDENCE.splice(evIdx, 1);

    const suIdx = SUSPECTS.findIndex((s) => s.id === selectedId);
    if (suIdx > -1) SUSPECTS.splice(suIdx, 1);

    toast({ tone: "info", title: "Node Deleted", detail: `Removed ${selectedId} from board.` });
    setSelectedId(null);
    setVersion((v) => v + 1);
  };

  const handleAddEvidenceSubmit = (title: string, description: string) => {
    const newId = `E-10${EVIDENCE.length + 1}`;
    EVIDENCE.push({
      id: newId,
      exhibit: `EXHIBIT ${String.fromCharCode(65 + EVIDENCE.length)}`,
      title: title || "New Evidence Found",
      type: "PHYSICAL",
      discovered: "Now",
      location: "Unknown",
      confidence: Math.floor(Math.random() * 50) + 50,
      img: null,
      description: description || "Newly logged evidence awaiting analysis.",
      analysis: "Pending.",
      connections: [],
    });
    
    const rx = Math.floor(Math.random() * 300) + 50;
    const ry = Math.floor(Math.random() * 450) + 50;
    
    NODES.push({
      id: newId,
      kind: "evidence",
      label: (title || "NEW EVIDENCE").toUpperCase(),
      name: title || "New Evidence",
      sub: "EVIDENCE",
      x: rx,
      y: ry,
    });
    
    EDGES.push({ a: "CASE", b: newId });
    toast({ tone: "gold", title: "Evidence Added", detail: `New node ${newId} mapped.` });
    setVersion(v => v + 1);
    setShowAddEvidence(false);
  };

  const handleAddSuspectSubmit = (name: string, description: string, role: string) => {
    const newId = `S-0${SUSPECTS.length + 1}`;
    SUSPECTS.push({
      id: newId,
      name: name || "New Suspect",
      initials: name ? name.substring(0, 2).toUpperCase() : "NS",
      role: (role as any) || "UNIDENTIFIED",
      description: description || "A mysterious person recently sighted.",
      alibi: "Unknown",
      clueAgainst: "Unknown",
      photo: "/sus/sherlock face.png",
      lastSeen: "Unknown",
      connectionCount: 1,
      status: "UNKNOWN",
    });

    const rx = Math.floor(Math.random() * 300) + 650;
    const ry = Math.floor(Math.random() * 450) + 50;
    
    NODES.push({
      id: newId,
      kind: "suspect",
      label: (name || "NEW SUSPECT").toUpperCase(),
      name: name || "New Suspect",
      sub: "SUSPECT",
      x: rx,
      y: ry,
    });
    
    EDGES.push({ a: "CASE", b: newId });
    toast({ tone: "red", title: "Suspect Added", detail: `New person ${newId} mapped.` });
    setVersion(v => v + 1);
    setShowAddSuspect(false);
  };

  const [modalEvidence, setModalEvidence] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [deductionOpen, setDeductionOpen] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [solvedCulpritId, setSolvedCulpritId] = useState<string | null>(null);
  const [solvedOverlayOpen, setSolvedOverlayOpen] = useState(false);
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

  const resolveCase = useCallback((culpritId: string) => {
    setResolved(true);
    setSolvedCulpritId(culpritId);
    setSolvedOverlayOpen(true);
    toast({
      tone: "gold",
      title: "Case Solved.",
      detail: `Culprit ${culpritId} identified. Deduction filed.`,
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
        onViewSolved={() => setSolvedOverlayOpen(true)}
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
                  THE SAPPHIRE THEFT
                </h1>
                <div
                  onClick={resolved ? () => setSolvedOverlayOpen(true) : undefined}
                  className={resolved ? "cursor-pointer transition-transform hover:scale-105" : ""}
                  title={resolved ? "Click to view case solved animation" : undefined}
                >
                  <Tag tone={resolved ? "green" : "gold"} className="mt-1">
                    {resolved ? "SOLVED" : "IN PROGRESS"}
                  </Tag>
                </div>
              </div>
              <p className="mt-2 font-mono text-[11px] tracking-[1.5px] text-mute">
                CASE #SH-4091 • OPENED 14 NOV 1897 • {VIEW_LABEL[view]}
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
              {selectedId && selectedId !== "CASE" && (
                <GhostButton onClick={handleDeleteNode} className="hidden sm:inline-flex !text-crimson !border-crimson/30 hover:!border-crimson hover:!text-crimson hover:!bg-crimson/10">
                  Delete Selected
                </GhostButton>
              )}
              <GhostButton onClick={() => setShowAddEvidence(true)} className="hidden sm:inline-flex">
                + Evidence
              </GhostButton>
              <GhostButton onClick={() => setShowAddSuspect(true)} className="hidden sm:inline-flex">
                + Suspect
              </GhostButton>
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
                      key={`graph-overview-${version}`}
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
                  key={`graph-connections-${version}`}
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
          onViewCelebration={() => setSolvedOverlayOpen(true)}
          onOpenEvidence={(id) => {
            setDeductionOpen(false);
            setTimeout(() => setModalEvidence(id), 160);
          }}
        />
      )}

      {solvedOverlayOpen && (
        <CaseSolvedOverlay
          culpritId={solvedCulpritId}
          onClose={() => setSolvedOverlayOpen(false)}
          onReopenDossier={() => {
            setSolvedOverlayOpen(false);
            setDeductionOpen(true);
          }}
        />
      )}
      {showAddEvidence && (
        <AddEvidenceModal 
          onClose={() => setShowAddEvidence(false)} 
          onAdd={handleAddEvidenceSubmit} 
        />
      )}
      
      {showAddSuspect && (
        <AddSuspectModal 
          onClose={() => setShowAddSuspect(false)} 
          onAdd={handleAddSuspectSubmit} 
        />
      )}
    </div>
  );
}
