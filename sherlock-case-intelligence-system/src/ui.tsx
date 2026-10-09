import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useCountUp, useReducedMotion } from "./hooks";

/* ── GoldButton — the one true CTA (fill sweeps in from the left) ─── */
export function GoldButton({
  children,
  onClick,
  large,
  className = "",
  arrow = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  large?: boolean;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-3 overflow-hidden border border-gold text-gold transition-colors duration-300 hover:text-bg ${
        large
          ? "px-10 py-4 text-[13px] tracking-[2.5px]"
          : "px-6 py-2.5 text-[12px] tracking-[2px]"
      } rounded-lg font-sans font-medium uppercase ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-x-100"
      />
      <span className="relative z-10">{children}</span>
      {arrow && (
        <ArrowRight
          size={15}
          strokeWidth={1.75}
          className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
        />
      )}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[2px] text-mute transition-colors duration-300 hover:border-gold/40 hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Tag — forensic mono chip ─────────────────────────────────────── */
export function Tag({
  children,
  tone = "gold",
  className = "",
}: {
  children: ReactNode;
  tone?: "gold" | "red" | "green" | "mute";
  className?: string;
}) {
  const tones: Record<string, string> = {
    gold: "text-gold border-gold/25 bg-gold/[0.06]",
    red: "text-crimson border-crimson/30 bg-crimson/[0.07]",
    green: "text-sage border-sage/30 bg-sage/[0.07]",
    mute: "text-mute border-line bg-white/[0.02]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] tracking-[1.5px] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ── SectionHead — mono kicker + Cormorant headline ───────────────── */
export function SectionHead({
  kicker,
  children,
  align = "left",
  className = "",
}: {
  kicker: string;
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`}>
      <div
        className={`flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}
      >
        <span className="h-px w-8 bg-gold/60" />
        <span className="font-mono text-[11px] tracking-[3px] text-gold">
          {kicker}
        </span>
        {align === "center" && <span className="h-px w-8 bg-gold/60" />}
      </div>
      <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-1.5px] text-ink">
        {children}
      </h2>
    </div>
  );
}

/* ── CountUp number ───────────────────────────────────────────────── */
export function CountUp({
  target,
  start,
  duration = 1700,
  className = "",
}: {
  target: number;
  start: boolean;
  duration?: number;
  className?: string;
}) {
  const v = useCountUp(target, start, duration);
  return (
    <span className={className}>{v.toLocaleString("en-GB")}</span>
  );
}

/* ── Toast system ─────────────────────────────────────────────────── */
type ToastTone = "gold" | "red" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-24 right-6 z-[95] flex w-[320px] flex-col gap-3">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  const bar =
    toast.tone === "gold"
      ? "border-l-gold"
      : toast.tone === "red"
        ? "border-l-crimson"
        : "border-l-line";
  const Icon =
    toast.tone === "gold" ? CheckCircle2 : toast.tone === "red" ? AlertTriangle : Info;
  const iconColor =
    toast.tone === "gold"
      ? "text-gold"
      : toast.tone === "red"
        ? "text-crimson"
        : "text-mute";

  return (
    <div
      className={`pointer-events-auto toast-in rounded-xl border border-line ${bar} border-l-[3px] bg-surface p-4 shadow-[var(--shadow-elev)] ${
        reduced ? "[animation:none]" : ""
      }`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <Icon size={16} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <p className="font-sans text-[13px] font-medium leading-snug text-ink">
            {toast.title}
          </p>
          {toast.detail && (
            <p className="mt-1 font-sans text-[12px] leading-snug text-mute">
              {toast.detail}
            </p>
          )}
        </div>
        <button
          onClick={onDone}
          aria-label="Dismiss"
          className="ml-auto font-mono text-[11px] text-mute transition-colors hover:text-ink"
        >
          ×
        </button>
      </div>
    </div>
  );
}
