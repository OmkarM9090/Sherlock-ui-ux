import { useScrollPast } from "../hooks";

const LINKS = [
  { label: "CASES", href: "#cases" },
  { label: "EVIDENCE", href: "#features" },
  { label: "INTELLIGENCE", href: "#intelligence" },
];

export default function Navbar({ onEnter }: { onEnter: () => void }) {
  const scrolled = useScrollPast(28);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[72px] transition-all duration-500 ${
        scrolled
          ? "border-b border-line/50 bg-bg/85 backdrop-blur-[16px]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6 lg:px-0">
        {/* logo lockup */}
        <a href="#top" className="group flex flex-col leading-none">
          <span className="font-display text-[22px] font-semibold tracking-[3px] text-gold">
            SHERLOCK
          </span>
          <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] tracking-[3px] text-mute">
            <span className="pulse-dot inline-block h-[5px] w-[5px] rounded-full bg-gold" />
            CASE INTELLIGENCE
          </span>
        </a>

        {/* links */}
        <nav className="hidden items-center gap-10 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="relative py-2 font-sans text-[12px] font-medium tracking-[2.5px] text-mute transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-[width] after:duration-300 hover:text-ink hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={onEnter}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-gold px-6 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[2px] text-gold transition-colors duration-300 hover:text-bg"
        >
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-x-100"
          />
          <span className="relative z-10">Enter Case</span>
          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </header>
  );
}
