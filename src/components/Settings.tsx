import { useState } from "react";
import { Globe } from "lucide-react";
import { Card, PageHeader, Btn } from "./ui";
import { useLanguage } from "../context/LanguageContext";

function Toggle({ on, set, label }: { on: boolean; set: (b: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "grad" : "bg-powder"}`}>
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function Settings() {
  const { lang, setLang, t } = useLanguage();
  const [s, setS] = useState({ daily: true, insights: true, reports: false, share: false, twofa: true });

  const rows: [keyof typeof s, string, string][] = [
    ["daily", t("settings.daily_checkin"), t("settings.daily_sub")],
    ["insights", t("settings.weekly_digest"), t("settings.weekly_sub")],
    ["reports", t("settings.report_alerts"), t("settings.report_sub")],
    ["twofa", t("settings.two_factor"), t("settings.two_factor_sub")],
    ["share", t("settings.share_data"), t("settings.share_sub")],
  ];

  return (
    <>
      <PageHeader title={t("settings.title")} sub={t("settings.sub")} />

      {/* Language Preferences Card */}
      <Card className="mb-6 max-w-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-sky text-accent">
            <Globe size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-navy">{t("settings.language_title")}</h3>
            <p className="text-xs text-ink-soft">{t("settings.language_desc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
              lang === "en"
                ? "border-accent bg-sky/50 text-navy shadow-xs ring-2 ring-accent/20"
                : "border-powder bg-white text-ink-soft hover:border-accent/40"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-navy">English</p>
              <p className="text-xs text-ink-soft">Locale (en-IN)</p>
            </div>
            {lang === "en" && <span className="size-2.5 rounded-full bg-accent" />}
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
              lang === "hi"
                ? "border-accent bg-sky/50 text-navy shadow-xs ring-2 ring-accent/20"
                : "border-powder bg-white text-ink-soft hover:border-accent/40"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-navy">हिन्दी (Hindi)</p>
              <p className="text-xs text-ink-soft">भाषा (hi-IN)</p>
            </div>
            {lang === "hi" && <span className="size-2.5 rounded-full bg-accent" />}
          </button>
        </div>
      </Card>

      <Card className="max-w-2xl divide-y divide-powder/60 p-2">
        {rows.map(([k, labelTitle, labelDesc]) => (
          <div key={k} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="font-bold">{labelTitle}</p>
              <p className="text-sm text-ink-soft">{labelDesc}</p>
            </div>
            <Toggle on={s[k]} set={(b) => setS({ ...s, [k]: b })} label={labelTitle} />
          </div>
        ))}
      </Card>
      <div className="mt-6 flex max-w-2xl gap-3">
        <Btn variant="secondary">{t("settings.export")}</Btn>
        <Btn variant="ghost" className="text-[#c2410c]">{t("settings.delete")}</Btn>
      </div>
    </>
  );
}
