import { useState } from "react";
import { Card, PageHeader, Btn } from "./ui";

function Toggle({ on, set, label }: { on: boolean; set: (b: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "grad" : "bg-powder"}`}>
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function Settings() {
  const [s, setS] = useState({ daily: true, insights: true, reports: false, share: false, twofa: true });
  const rows: [keyof typeof s, string, string][] = [
    ["daily", "Daily check-in reminder", "A gentle nudge at 8:00 am"],
    ["insights", "Weekly insight digest", "Sunday summary of your trends"],
    ["reports", "Report processing alerts", "Notify when documents are ready"],
    ["twofa", "Two-factor authentication", "Extra security at sign in"],
    ["share", "Share anonymized data for research", "Off by default"],
  ];
  return (
    <>
      <PageHeader title="Settings" sub="Notifications, privacy and account preferences." />
      <Card className="max-w-2xl divide-y divide-powder/60 p-2">
        {rows.map(([k, t, d]) => (
          <div key={k} className="flex items-center gap-4 p-4">
            <div className="flex-1"><p className="font-bold">{t}</p><p className="text-sm text-ink-soft">{d}</p></div>
            <Toggle on={s[k]} set={(b) => setS({ ...s, [k]: b })} label={t} />
          </div>
        ))}
      </Card>
      <div className="mt-6 flex max-w-2xl gap-3"><Btn variant="secondary">Export my data</Btn><Btn variant="ghost" className="text-[#c2410c]">Delete account</Btn></div>
    </>
  );
}
