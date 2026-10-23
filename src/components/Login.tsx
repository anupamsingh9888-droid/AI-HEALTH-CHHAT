import { useState } from "react";
import { Eye, EyeOff, HeartPulse, LineChart, Sparkles, Sprout, AlertCircle, Loader2 } from "lucide-react";
import { Btn, Field, Leaf, Logo } from "./ui";
import hero from "../assets/wellness-hero.png";
import { api } from "../api/client";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [show, setShow] = useState(false);
  const [id, setId] = useState("maya@example.com");
  const [pw, setPw] = useState("password123");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const idOk = /^\S+@\S+\.\S+$/.test(id) || /^\+?\d{10,13}$/.test(id.replace(/\s/g, ""));
  const pwOk = pw.length >= 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setAuthError("");
    if (idOk && pwOk) {
      setLoading(true);
      try {
        await api.auth.login(id, pw);
        onLogin();
      } catch (err: any) {
        // If server is active and rejected credentials, show error; otherwise permit dev preview
        if (err.message && err.message.includes("401")) {
          setAuthError("Invalid credentials. Try maya@example.com / password123");
        } else {
          onLogin();
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]" style={{ background: "linear-gradient(135deg,#eaf5ff 0%,#f3efff 55%,#e6f8f1 100%)" }}>
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16">
        <Leaf className="pointer-events-none absolute -left-6 bottom-10 h-64 opacity-70" />
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-extrabold">AI Health Copilot</span>
        </div>
        <div className="fade-in max-w-xl">
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">
            Your Health, <span className="bg-linear-to-r from-accent to-violet bg-clip-text text-transparent">Beautifully</span> Understood.
          </h1>
          <p className="mt-4 text-lg text-ink-soft">Smarter insights. Better habits. A healthier you.</p>
        </div>
        <div className="relative my-6 h-72 overflow-hidden rounded-[2rem] border border-white/70 bg-sky shadow-[0_24px_60px_-20px_rgba(23,54,93,.3)] ring-4 ring-white/40 xl:h-80">
          <img src={hero} alt="A young person meditating peacefully among soft green plants" className="h-full w-full object-cover object-left" />
          <div className="absolute inset-y-0 right-0 w-[34%] bg-linear-to-l from-[#f3f8fd] via-[#f3f8fd]/95 to-transparent" aria-hidden />
          <div className="float glass absolute left-4 top-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold">
            <HeartPulse size={16} className="text-turq" /> 72 bpm · calm
          </div>
          <p className="absolute right-5 top-1/2 max-w-[28%] -translate-y-1/2 font-hand text-2xl leading-tight text-navy xl:text-3xl">Small steps today, brighter tomorrows.</p>
        </div>
        <ul className="flex flex-wrap gap-3">
          {[
            [LineChart, "Track Your Health"],
            [Sparkles, "Discover AI Insights"],
            [Sprout, "Build Better Habits"],
          ].map(([I, t]: any) => (
            <li key={t} className="glass flex items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-bold">
              <span className="grid size-8 place-items-center rounded-full bg-white text-accent"><I size={16} /></span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <form onSubmit={submit} noValidate className="fade-in w-full max-w-md rounded-[2rem] border border-white bg-ivory/95 p-7 shadow-[0_30px_80px_-24px_rgba(23,54,93,.28)] sm:p-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Logo size={36} />
            <span className="font-extrabold">AI Health Copilot</span>
          </div>
          <h2 className="text-3xl font-extrabold">Welcome Back!</h2>
          <p className="mt-1 text-ink-soft">Continue your journey toward better health.</p>

          <div className="mt-7 space-y-4">
            <div>
              <Field label="Email or mobile number" placeholder="maya@example.com" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" aria-invalid={touched && !idOk} />
              {touched && !idOk && <Err>Enter a valid email or mobile number.</Err>}
            </div>
            <div>
              <div className="relative">
                <Field label="Password" type={show ? "text" : "password"} placeholder="At least 6 characters" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" aria-invalid={touched && !pwOk} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute bottom-1.5 right-1.5 grid size-9 place-items-center rounded-xl text-ink-soft hover:bg-sky">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched && !pwOk && <Err>Password must be at least 6 characters.</Err>}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" defaultChecked className="size-4 accent-accent" /> Remember me
            </label>
            <a href="#" className="font-bold text-accent hover:underline">Forgot Password?</a>
          </div>

          {authError && <div className="mt-4"><Err>{authError}</Err></div>}
          <Btn type="submit" disabled={loading} className="mt-6 h-13 w-full text-base">
            {loading ? <span className="inline-flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Signing in...</span> : "Login"}
          </Btn>
          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-ink-soft"><span className="h-px flex-1 bg-powder" />or<span className="h-px flex-1 bg-powder" /></div>
          <Btn type="button" variant="secondary" className="w-full bg-white" onClick={onLogin}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45 24.500c0-1.600-.1-2.800-.4-4H24v7.600h11.800c-.2 1.900-1.500 4.800-4.400 6.700l6.800 5.300C42.500 36.400 45 31 45 24.500Z"/><path fill="#34A853" d="M24 46c6 0 11-2 14.700-5.400l-6.800-5.300c-1.800 1.300-4.300 2.100-7.900 2.100-6 0-11-4-12.800-9.400l-7 5.400C7.500 41 15 46 24 46Z"/><path fill="#FBBC05" d="M11.200 28c-.5-1.400-.8-2.900-.8-4.500s.3-3.100.8-4.500l-7-5.400A22 22 0 0 0 2 23.500c0 3.600.9 7 2.200 9.900l7-5.400Z"/><path fill="#EA4335" d="M24 10.100c4.100 0 6.900 1.800 8.500 3.300l6.200-6C35 3.900 30 2 24 2 15 2 7.500 7 4.200 14l7 5.400C13 14.100 18 10.100 24 10.100Z"/></svg>
            Continue with Google
          </Btn>
          <p className="mt-6 text-center text-sm text-ink-soft">New here? <a href="#" className="font-bold text-accent hover:underline">Create an account</a></p>
        </form>
      </section>
    </div>
  );
}

function Err({ children }: { children: string }) {
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#c2410c]">
      <AlertCircle size={14} /> {children}
    </p>
  );
}
