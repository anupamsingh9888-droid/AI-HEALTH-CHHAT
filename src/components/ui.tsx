import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-powder/60 bg-white shadow-soft ${className}`}>{children}</div>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...p
}: { variant?: "primary" | "secondary" | "ghost" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: "grad text-white shadow-[0_8px_24px_-8px_rgba(95,120,230,.6)] hover:brightness-105 hover:-translate-y-0.5",
    secondary: "bg-sky text-navy border border-powder hover:bg-powder/60",
    ghost: "text-accent hover:bg-sky",
  }[variant];
  return (
    <button
      {...p}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  className = "",
  ...p
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">{label}</span>
      <input
        {...p}
        className="h-12 w-full rounded-2xl border border-powder bg-ivory px-4 text-sm font-semibold text-navy outline-none transition placeholder:font-medium placeholder:text-ink-soft/60 hover:border-accent/50 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/15"
      />
    </label>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-1.5 max-w-xl text-ink-soft">{sub}</p>
      </div>
      {right}
    </div>
  );
}

export function Badge({ children, tone = "sky" }: { children: ReactNode; tone?: "sky" | "mint" | "lav" | "amber" }) {
  const t = {
    sky: "bg-sky text-accent",
    mint: "bg-mint text-[#12806f]",
    lav: "bg-lav text-violet",
    amber: "bg-[#fff1d6] text-[#a8670a]",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${t}`}>{children}</span>;
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#5fa3ec" />
          <stop offset="1" stopColor="#8a7bdc" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#lg)" />
      <path
        d="M24 36S11 28.5 11 19.5A6.5 6.5 0 0 1 24 17a6.5 6.5 0 0 1 13 2.500C37 28.500 24 36 24 36Z"
        fill="rgba(255,255,255,.22)"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <path d="M13 24h6l2-5 3.500 9 2.500-6 1.500 2H35" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Leaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <path d="M60 155C60 100 62 50 70 5" stroke="#7cc4b0" strokeWidth="2" strokeLinecap="round" />
      {[30, 55, 80, 105, 128].map((y, i) => (
        <g key={y}>
          <path d={`M${64 - i} ${y}C40 ${y - 14} 22 ${y - 6} 18 ${y + 4}C38 ${y + 14} 56 ${y + 8} ${64 - i} ${y}Z`} fill="#bfeadb" opacity=".85" />
          <path d={`M${66 - i} ${y - 8}C86 ${y - 22} 102 ${y - 14} 106 ${y - 4}C88 ${y + 6} 72 ${y} ${66 - i} ${y - 8}Z`} fill="#d9d2fb" opacity=".85" />
        </g>
      ))}
    </svg>
  );
}

export function Sparkline({ data, color = "#4f8fe0" }: { data: number[]; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-24" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.500" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
