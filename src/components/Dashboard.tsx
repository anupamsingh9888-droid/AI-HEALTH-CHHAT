import { useState, useEffect } from "react";
import {
  Bell,
  CalendarDays,
  Cake,
  Scale,
  Moon,
  Footprints,
  ArrowRight,
  MessageCircleHeart,
  FileText,
  UserRound,
  TrendingDown,
} from "lucide-react";
import { Card, Btn, Leaf, Sparkline } from "./ui";
import type { View } from "./Shell";
import { api, HealthSummary } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { getTodayLocalCalendarDate } from "../utils/date";

export default function Dashboard({ go }: { go: (v: View) => void }) {
  const { lang, t } = useLanguage();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [userName, setUserName] = useState("Maya");

  useEffect(() => {
    let mounted = true;
    api.health.summary()
      .then((data) => {
        if (mounted && data) {
          setSummary(data);
          if (data.user_name) {
            setUserName(data.user_name.split(" ")[0]);
          }
        }
      })
      .catch((err) => console.warn("Using dashboard local state:", err.message));
    return () => { mounted = false; };
  }, []);

  const todayDateStr = getTodayLocalCalendarDate(lang);

  const metrics = [
    {
      label: t("dash.age"),
      value: summary?.current_metrics?.age?.value || "29",
      unit: t("dash.years"),
      icon: Cake,
      bg: "bg-sky",
      data: [29, 29, 29, 29, 29, 29, 29],
    },
    {
      label: t("dash.weight"),
      value: summary?.current_metrics?.weight?.value || "62.4",
      unit: t("dash.kg"),
      icon: Scale,
      bg: "bg-lav",
      data: [63, 62.8, 62.9, 62.6, 62.5, 62.4, 62.4],
    },
    {
      label: t("dash.sleep"),
      value: summary?.current_metrics?.sleep?.value || "6h 42m",
      unit: t("dash.sleep_unit"),
      icon: Moon,
      bg: "bg-mint",
      data: [7.6, 7.4, 7.5, 6.9, 6.5, 6.4, 6.7],
    },
    {
      label: t("dash.activity"),
      value: summary?.current_metrics?.steps?.value || "8,420",
      unit: t("dash.steps_unit"),
      icon: Footprints,
      bg: "bg-powder/60",
      data: [6, 7.2, 8, 7.5, 9.1, 8.6, 8.4],
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("dash.greeting")}, {userName}
          </h1>
          <p className="mt-1.5 max-w-lg text-ink-soft">
            {t("dash.sub")}
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold shadow-soft">
            <CalendarDays size={16} className="text-accent" />
            <span>{todayDateStr}</span>
          </div>
          <button
            aria-label="Notifications"
            className="relative grid size-11 place-items-center rounded-2xl bg-white shadow-soft hover:bg-sky"
          >
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-violet text-[10px] font-bold text-white">
              3
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className={`${m.bg} group rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-soft`}>
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-white/80 text-accent">
                <m.icon size={19} />
              </span>
              <Sparkline data={m.data} />
            </div>
            <p className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{m.value}</p>
            <p className="text-sm font-bold">{m.label}</p>
            <p className="text-xs text-ink-soft">{m.unit}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden bg-linear-to-br from-white via-white to-lav/60 p-6 sm:p-8">
          <Leaf className="absolute -right-4 -top-2 h-44 opacity-60" />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lav px-3 py-1 text-xs font-bold text-violet">
                {t("dash.ai_insight")}
              </span>
              <h2 className="mt-3 text-xl font-extrabold">{t("dash.insight_title")}</h2>
              <p className="mt-3 flex items-start gap-2 text-lg font-bold leading-snug">
                <TrendingDown className="mt-0.5 shrink-0 text-violet" size={22} />
                {t("dash.insight_desc")}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                {t("dash.insight_body")}
              </p>
              <Btn className="mt-5" onClick={() => go("insights")}>
                {t("dash.view_details")} <ArrowRight size={16} />
              </Btn>
            </div>
            <svg viewBox="0 0 160 140" className="float mx-auto h-36 w-40" aria-hidden>
              <circle cx="80" cy="70" r="62" fill="#eae4ff" />
              <path d="M100 30a42 42 0 1 0 22 62A34 34 0 0 1 100 30Z" fill="#fff" />
              <g fill="#8a7bdc">
                <path d="M40 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
                <circle cx="130" cy="38" r="3" />
                <circle cx="118" cy="108" r="2.500" />
              </g>
              <text x="52" y="124" fill="#8a7bdc" fontSize="16" fontWeight="800">
                z z z
              </text>
            </svg>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-extrabold">{t("dash.quick_actions")}</h2>
          <div className="mt-4 space-y-3">
            {(
              [
                [t("dash.action_chat"), t("dash.action_chat_sub"), MessageCircleHeart, "chat", "bg-sky"],
                [t("dash.action_reports"), `${summary?.verified_reports_count ?? 3} ${t("dash.action_reports_sub")}`, FileText, "reports", "bg-mint"],
                [t("dash.action_profile"), t("dash.action_profile_sub"), UserRound, "profile", "bg-lav"],
              ] as const
            ).map(([actionTitle, actionSub, I, v, bg]) => (
              <button
                key={actionTitle}
                onClick={() => go(v)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-powder/60 p-3 text-left transition hover:border-accent/40 hover:bg-ivory"
              >
                <span className={`grid size-12 place-items-center rounded-xl ${bg} text-accent`}>
                  <I size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-extrabold">{actionTitle}</span>
                  <span className="text-xs text-ink-soft">{actionSub}</span>
                </span>
                <ArrowRight size={16} className="text-ink-soft transition group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
