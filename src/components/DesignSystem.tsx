import { useState } from "react";
import { Bell, Home, Moon, X, CheckCircle2, Sparkles } from "lucide-react";
import { Badge, Btn, Card, Field, PageHeader } from "./ui";

const colors = [["Sky", "#EAF5FF"], ["Powder", "#CFE8FF"], ["Lavender", "#EAE4FF"], ["Mint", "#DDF7ED"], ["Ivory", "#FFFCF7"], ["Navy", "#17365D"], ["Accent", "#4F8FE0"], ["Violet", "#8A7BDC"], ["Turquoise", "#2BB5A6"]];

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <Card className="p-6"><h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-ink-soft">{t}</h2>{children}</Card>;
}

export default function DesignSystem() {
  const [tab, setTab] = useState(0);
  const [modal, setModal] = useState(false);
  return (
    <>
      <PageHeader title="Design System" sub="Manrope, an 8-point spacing grid, 16–24px radii and a pastel palette anchored by deep navy." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Sec t="Colour">
          <div className="grid grid-cols-3 gap-3">{colors.map(([n, c]) => <div key={n}><div className="h-14 rounded-2xl border border-powder/60" style={{ background: c }} /><p className="mt-1.5 text-xs font-bold">{n}</p><p className="text-[11px] text-ink-soft">{c}</p></div>)}</div>
        </Sec>
        <Sec t="Typography">
          <p className="text-4xl font-extrabold tracking-tight">Display 36</p>
          <p className="mt-2 text-2xl font-extrabold">Heading 24</p>
          <p className="mt-2 text-base font-bold">Title 16 bold</p>
          <p className="mt-2 text-sm text-ink-soft">Body 14 regular, comfortable for long reading.</p>
          <p className="mt-2 font-hand text-2xl text-violet">Handwritten note</p>
        </Sec>
        <Sec t="Buttons">
          <div className="flex flex-wrap gap-3"><Btn>Primary</Btn><Btn variant="secondary">Secondary</Btn><Btn disabled>Disabled</Btn></div>
        </Sec>
        <Sec t="Fields">
          <div className="grid gap-3"><Field label="Text field" placeholder="Maya Rao" /><Field label="Password field" type="password" defaultValue="secret123" /></div>
        </Sec>
        <Sec t="Tabs & chips & badges">
          <div className="flex gap-2">{["Sleep", "Activity", "Weight"].map((t, i) => <button key={t} onClick={() => setTab(i)} className={`h-10 rounded-full px-5 text-sm font-bold ${tab === i ? "grad text-white" : "bg-sky text-ink-soft"}`}>{t}</button>)}</div>
          <div className="mt-4 flex flex-wrap items-center gap-2"><Badge>Info</Badge><Badge tone="mint">Processed</Badge><Badge tone="lav">AI</Badge><Badge tone="amber">Processing</Badge><span className="relative ml-2 grid size-10 place-items-center rounded-xl bg-sky"><Bell size={17} /><span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-violet text-[10px] font-bold text-white">3</span></span></div>
        </Sec>
        <Sec t="Navigation item & metric card">
          <div className="space-y-2"><div className="flex h-12 items-center gap-3 rounded-2xl bg-linear-to-r from-sky to-lav px-4 text-sm font-bold"><Home size={18} className="text-accent" />Active</div><div className="flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-ink-soft"><Home size={18} />Default</div></div>
          <div className="mt-4 rounded-3xl bg-mint p-5"><Moon size={18} className="text-turq" /><p className="mt-3 text-2xl font-extrabold">6h 42m</p><p className="text-sm font-bold">Sleep</p></div>
        </Sec>
        <Sec t="Chat bubbles & insight card">
          <div className="space-y-2 text-sm"><p className="max-w-[80%] rounded-3xl rounded-bl-md bg-linear-to-br from-sky to-lav px-4 py-3">How can I help today?</p><p className="ml-auto max-w-[80%] rounded-3xl rounded-br-md grad px-4 py-3 text-white">Why am I tired?</p></div>
          <div className="mt-4 rounded-2xl bg-lav/60 p-4 text-sm font-bold"><Sparkles size={16} className="mb-1 text-violet" />Sleep decreased by 18%.</div>
        </Sec>
        <Sec t="Modal & toast">
          <Btn variant="secondary" onClick={() => setModal(true)}>Open modal</Btn>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-bold text-white"><CheckCircle2 size={16} className="text-mint" />Profile saved</div>
        </Sec>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div role="dialog" aria-modal className="fade-in w-full max-w-sm rounded-3xl bg-white p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between"><h3 className="text-lg font-extrabold">Delete this report?</h3><button aria-label="Close" onClick={() => setModal(false)}><X size={18} /></button></div>
            <p className="mt-2 text-sm text-ink-soft">This removes the document and its summary from your account.</p>
            <div className="mt-5 flex justify-end gap-2"><Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={() => setModal(false)}>Delete</Btn></div>
          </div>
        </div>
      )}
    </>
  );
}
