import {
  LayoutDashboard,
  FolderOpen,
  Fingerprint,
  Users,
  Clock3,
  Network,
  BrainCircuit,
  Settings,
  LogOut,
} from "lucide-react";

export type DashView =
  | "overview"
  | "cases"
  | "evidence"
  | "suspects"
  | "timeline"
  | "connections";

const PRIMARY: { id: DashView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "OVERVIEW", icon: LayoutDashboard },
  { id: "cases", label: "CASES", icon: FolderOpen },
  { id: "evidence", label: "EVIDENCE", icon: Fingerprint },
  { id: "suspects", label: "SUSPECTS", icon: Users },
  { id: "timeline", label: "TIMELINE", icon: Clock3 },
  { id: "connections", label: "CONNECTIONS", icon: Network },
];

export default function Sidebar({
  view,
  onNavigate,
  onIntelligence,
  onSettings,
  onExit,
  resolved,
}: {
  view: DashView;
  onNavigate: (v: DashView) => void;
  onIntelligence: () => void;
  onSettings: () => void;
  onExit: () => void;
  resolved: boolean;
}) {
  const item = (
    active: boolean,
    label: string,
    Icon: typeof LayoutDashboard,
    onClick: () => void
  ) => (
    <button
      key={label}
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-r-lg border-l-2 py-2.5 pl-5 pr-4 text-left transition-colors duration-200 ${
        active
          ? "border-gold bg-gold/[0.08] text-ink"
          : "border-transparent text-mute hover:border-gold hover:bg-white/[0.03] hover:text-ink"
      }`}
    >
      <Icon size={17} strokeWidth={1.6} className={active ? "text-gold" : ""} />
      <span className="font-sans text-[13px] font-medium tracking-[0.5px]">{label}</span>
    </button>
  );

  return (
    <aside data-side className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-line bg-surface lg:flex">
      {/* logo */}
      <div className="px-6 pb-5 pt-7">
        <span className="font-display text-[20px] font-semibold tracking-[2.5px] text-gold">
          SHERLOCK
        </span>
        <span className="mt-2 block h-[2px] w-8 bg-gold" />
      </div>

      {/* primary nav */}
      <nav className="mt-6 flex flex-col gap-1" aria-label="Case">
        {PRIMARY.map((p) => item(view === p.id, p.label, p.icon, () => onNavigate(p.id)))}
      </nav>

      <div className="mx-6 my-6 h-px bg-line" />

      <nav className="flex flex-col gap-1" aria-label="System">
        {item(false, "INTELLIGENCE", BrainCircuit, onIntelligence)}
        {item(false, "SETTINGS", Settings, onSettings)}
      </nav>

      {/* case status card */}
      <div className="mt-auto px-6 pb-6">
        <div className="rounded-lg border border-gold/15 bg-gold/[0.06] px-4 py-3">
          <p className="font-mono text-[11px] tracking-[1.5px] text-gold">
            CASE #SH-2048
          </p>
          <p className="mt-1.5 flex items-center gap-2 font-mono text-[10px] tracking-[1.5px]">
            {resolved ? (
              <>
                <span className="h-[6px] w-[6px] rounded-full bg-sage" />
                <span className="text-sage">RESOLVED</span>
              </>
            ) : (
              <>
                <span className="pulse-dot-green h-[6px] w-[6px] rounded-full bg-sage" />
                <span className="text-sage">ACTIVE</span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={onExit}
          className="mt-4 flex items-center gap-2.5 px-1 font-sans text-[12px] font-medium tracking-[1px] text-mute transition-colors duration-200 hover:text-ink"
        >
          <LogOut size={14} strokeWidth={1.6} />
          EXIT CASE
        </button>
      </div>
    </aside>
  );
}
