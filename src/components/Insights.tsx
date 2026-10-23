import { useState, useEffect } from "react";
import { Lightbulb, Sparkles, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, PageHeader } from "./ui";
import { api, HealthInsight } from "../api/client";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TABS = {
  Sleep: {
    unit: "h", now: [7.4, 6.2, 5.9, 6.5, 6.8, 7.3, 6.8], prev: [8.0, 8.2, 8.1, 8.3, 8.0, 8.4, 8.2], max: 10, avg: "6h 42m", delta: -18,
    obs: ["Tuesday and Wednesday were your shortest nights, both under 6.5 hours.", "Your weekend sleep recovered to about 7 hours, a gentle rebound.", "Sleep this week is below your 8-hour goal on 6 of 7 nights."],
    tips: ["Set a wind-down alarm at 10:15 pm.", "Keep your bedroom cool and dark.", "Limit late caffeine after 2 pm."],
  },
  Activity: {
    unit: "k steps", now: [8.1, 9.4, 7.2, 8.8, 10.2, 6.1, 9.0], prev: [7.0, 7.6, 6.9, 8.0, 8.2, 5.4, 7.5], max: 12, avg: "8,400", delta: 12,
    obs: ["Friday was your most active day at 10,200 steps.", "Average steps are up about 12% on last week.", "Saturday was lighter, which is a normal rest pattern."],
    tips: ["Add a 10-minute walk after lunch.", "Try taking calls while walking.", "Plan one active social outing each weekend."],
  },
  Weight: {
    unit: "kg", now: [62.9, 62.8, 62.7, 62.6, 62.5, 62.5, 62.4], prev: [63.2, 63.1, 63.1, 63.0, 63.0, 62.9, 62.9], max: 65, avg: "62.6 kg", delta: -1,
    obs: ["Weight has trended gently downward across the week.", "Daily changes under 0.5 kg are normal fluctuation.", "You are 0.6 kg from your 3 kg goal this month."],
    tips: ["Weigh at the same time each morning.", "Focus on trends, not single readings.", "Pair steady meals with your walking habit."],
  },
  Nutrition: {
    unit: "kcal", now: [1950, 2100, 1880, 2050, 2200, 2400, 1990], prev: [2100, 2150, 2050, 2200, 2300, 2500, 2150], max: 3000, avg: "2,081", delta: -5,
    obs: ["Intake is steady on weekdays and rises on Saturday.", "Logged calories are about 5% lower than last week.", "Protein was logged on 5 of 7 days."],
    tips: ["Add a vegetable to two meals a day.", "Keep water within reach.", "Plan Saturday meals ahead."],
  },
} as const;

export default function Insights() {
  const [tab, setTab] = useState<keyof typeof TABS>("Sleep");
  const [serverInsights, setServerInsights] = useState<Record<string, HealthInsight>>({});

  useEffect(() => {
    let mounted = true;
    api.health.insights()
      .then((res) => {
        if (!mounted || !res?.insights) return;
        const mapped: Record<string, HealthInsight> = {};
        for (const item of res.insights) {
          mapped[item.category] = item;
        }
        setServerInsights(mapped);
      })
      .catch((err) => console.warn("Using local tab telemetry:", err.message));
    return () => { mounted = false; };
  }, []);

  const d = TABS[tab];
  const serverItem = serverInsights[tab];
  const tips = serverItem?.tips && serverItem.tips.length > 0 ? serverItem.tips : d.tips;
  const obs = serverItem?.observation ? [serverItem.observation, ...d.obs.slice(1)] : d.obs;

  const W = 640, H = 240, pad = 28, bw = 26;
  const x = (i: number) => pad + 20 + i * ((W - pad * 2 - 40) / 6);
  const y = (v: number) => H - pad - (v / d.max) * (H - pad * 2);
  const line = d.now.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const down = d.delta < 0;

  return (
    <>
      <PageHeader title="Health Insights" sub="Trends from the last 7 days, compared with the week before." />
      <div role="tablist" className="mb-6 flex gap-2 overflow-x-auto">
        {Object.keys(TABS).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t as any)} className={`h-11 shrink-0 rounded-full px-6 text-sm font-bold transition ${tab === t ? "grad text-white shadow-soft" : "bg-white text-ink-soft ring-1 ring-powder hover:text-navy"}`}>{t}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-extrabold">Weekly {tab.toLowerCase()} trend</h2><p className="text-sm text-ink-soft">Average {d.avg}</p></div>
            <div className="flex items-center gap-4 text-xs font-bold text-ink-soft"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-accent" />This week</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-powder" />Last week</span></div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={`${tab} chart for the past week`}>
            <defs><linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5fa3ec" /><stop offset="1" stopColor="#8a7bdc" /></linearGradient></defs>
            {[0, 0.5, 1].map((t) => <g key={t}><line x1={pad} x2={W - pad} y1={y(d.max * t)} y2={y(d.max * t)} stroke="#e3eefb" strokeDasharray="4 4" /><text x={0} y={y(d.max * t) + 4} fontSize="10" fill="#5b7391">{tab === "Weight" ? "" : Math.round(d.max * t)}</text></g>)}
            {d.prev.map((v, i) => <rect key={i} x={x(i) - bw / 2 - 14} width={bw - 8} y={y(v)} height={H - pad - y(v)} rx="6" fill="#cfe8ff" />)}
            {d.now.map((v, i) => <rect key={i} x={x(i) - 4} width={bw - 4} y={y(v)} height={H - pad - y(v)} rx="8" fill="url(#bar)"><title>{`${days[i]}: ${v} ${d.unit}`}</title></rect>)}
            {tab === "Weight" && <polyline points={line} fill="none" stroke="#2bb5a6" strokeWidth="2.500" />}
            {days.map((l, i) => <text key={l} x={x(i) + 3} y={H - 8} fontSize="11" fontWeight="700" textAnchor="middle" fill="#5b7391">{l}</text>)}
          </svg>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">vs previous week</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl font-extrabold">{Math.abs(d.delta)}%</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${down && tab === "Sleep" ? "bg-[#fff1d6] text-[#a8670a]" : "bg-mint text-[#12806f]"}`}>{down ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{down ? "Lower" : "Higher"}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">Average {tab.toLowerCase()} is {d.avg} per day this week.</p>
          </Card>
          <Card className="bg-linear-to-br from-white to-lav/60 p-6">
            <h3 className="flex items-center gap-2 font-extrabold"><Sparkles size={18} className="text-violet" />AI observations</h3>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed">{obs.map((o) => <li key={o} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />{o}</li>)}</ul>
          </Card>
        </div>
      </div>

      <Card className="mt-6 bg-mint/60 p-6">
        <h3 className="flex items-center gap-2 font-extrabold"><Lightbulb size={18} className="text-turq" />Suggestions for you</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{tips.map((t, i) => <div key={t} className="rounded-2xl bg-white p-4 text-sm font-semibold"><span className="mb-2 grid size-7 place-items-center rounded-full bg-sky text-xs font-extrabold text-accent">{i + 1}</span>{t}</div>)}</div>
        <p className="mt-4 text-xs text-ink-soft">Observations describe patterns in your logged data and are not medical diagnoses.</p>
      </Card>
    </>
  );
}
