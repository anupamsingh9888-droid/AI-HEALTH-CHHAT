import { ReactNode } from "react";
import { Bell, FileText, Home, LineChart, MessageCircleHeart, Palette, Settings, UserRound, LogOut } from "lucide-react";
import { Logo } from "./ui";

export type View = "home" | "profile" | "chat" | "insights" | "reports" | "settings" | "system";

export const NAV: { id: View; label: string; icon: any }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "profile", label: "Health Profile", icon: UserRound },
  { id: "chat", label: "AI Health Chat", icon: MessageCircleHeart },
  { id: "insights", label: "Health Insights", icon: LineChart },
  { id: "reports", label: "Medical Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Avatar({ size = 44 }: { size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center rounded-full bg-linear-to-br from-powder to-lav font-extrabold text-navy ring-2 ring-white" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      MR
    </div>
  );
}

export default function Shell({ view, setView, onLogout, children }: { view: View; setView: (v: View) => void; onLogout: () => void; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-powder/60 bg-white/80 p-6 backdrop-blur lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <p className="font-extrabold">AI Health</p>
            <p className="text-xs font-bold tracking-widest text-ink-soft">COPILOT</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Main">
          {NAV.map((n) => {
            const on = view === n.id;
            return (
              <button key={n.id} onClick={() => setView(n.id)} aria-current={on ? "page" : undefined}
                className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${on ? "bg-linear-to-r from-sky to-lav text-navy shadow-sm" : "text-ink-soft hover:bg-sky/70 hover:text-navy"}`}>
                <n.icon size={19} className={on ? "text-accent" : ""} /> {n.label}
              </button>
            );
          })}
          <button onClick={() => setView("system")} className={`mt-4 flex h-10 items-center gap-3 rounded-2xl px-4 text-xs font-bold ${view === "system" ? "bg-lav text-navy" : "text-ink-soft hover:bg-sky/70"}`}>
            <Palette size={16} /> Design System
          </button>
        </nav>
        <div className="mt-auto rounded-2xl bg-linear-to-br from-sky to-mint p-3">
          <div className="flex items-center gap-3">
            <Avatar />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">Maya Rao</p>
              <p className="truncate text-xs text-ink-soft">maya@example.com</p>
            </div>
            <button onClick={onLogout} aria-label="Log out" className="grid size-9 place-items-center rounded-xl text-ink-soft hover:bg-white"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-powder/60 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2"><Logo size={32} /><span className="font-extrabold">AI Health Copilot</span></div>
        <button aria-label="Notifications" className="relative grid size-11 place-items-center rounded-2xl bg-sky"><Bell size={18} /><span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-violet" /></button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-12 lg:pt-10">
        <div key={view} className="fade-in">{children}</div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-3xl border border-white bg-white/90 p-1.5 shadow-soft backdrop-blur lg:hidden" aria-label="Mobile">
        {NAV.filter((n) => n.id !== "settings").map((n) => (
          <button key={n.id} onClick={() => setView(n.id)} aria-label={n.label} aria-current={view === n.id ? "page" : undefined}
            className={`grid h-12 flex-1 place-items-center rounded-2xl transition ${view === n.id ? "bg-linear-to-r from-sky to-lav text-accent" : "text-ink-soft"}`}>
            <n.icon size={21} />
          </button>
        ))}
        <button onClick={() => setView("settings")} aria-label="Settings" className={`grid h-12 flex-1 place-items-center rounded-2xl ${view === "settings" ? "bg-lav text-accent" : "text-ink-soft"}`}><Settings size={21} /></button>
      </nav>
    </div>
  );
}
