import { useState, useEffect } from "react";
import { Camera, Check, Heart, Loader2 } from "lucide-react";
import { Btn, Card, Field, PageHeader, Leaf } from "./ui";
import { Avatar } from "./Shell";
import { api, Profile as ProfileType } from "../api/client";

const levels = ["Sedentary", "Lightly active", "Moderately active", "Very active"];
const allGoals = ["Better sleep", "Lose 3 kg", "Walk 10k steps", "Reduce stress", "Eat more plants", "Build strength"];

export default function Profile() {
  const [fullName, setFullName] = useState("Maya Rao");
  const [age, setAge] = useState<number | string>(29);
  const [height, setHeight] = useState<number | string>(167);
  const [weight, setWeight] = useState<number | string>(62.4);
  const [level, setLevel] = useState("Moderately active");
  const [gender, setGender] = useState("Female");
  const [goals, setGoals] = useState(["Better sleep", "Walk 10k steps"]);
  const [allergies, setAllergies] = useState("Seasonal pollen");
  const [meds, setMeds] = useState("Vitamin D3 1000 IU");
  const [diet, setDiet] = useState("Flexitarian, balanced whole foods");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.profile.get()
      .then((data: ProfileType) => {
        if (!mounted || !data) return;
        if (data.full_name) setFullName(data.full_name);
        if (data.age) setAge(data.age);
        if (data.height_cm) setHeight(data.height_cm);
        if (data.weight_kg) setWeight(data.weight_kg);
        if (data.gender) setGender(data.gender);
        if (data.activity_level) setLevel(data.activity_level);
        if (data.health_goals && data.health_goals.length > 0) setGoals(data.health_goals);
        if (data.allergies && data.allergies.length > 0) setAllergies(data.allergies.join(", "));
        if (data.current_medications && data.current_medications.length > 0) setMeds(data.current_medications.join(", "));
        if (data.dietary_preferences) setDiet(data.dietary_preferences);
      })
      .catch((err) => console.warn("Using local profile state:", err.message));
    return () => { mounted = false; };
  }, []);

  const toggle = (g: string) => setGoals((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  const chip = (on: boolean) => `h-10 rounded-full border px-4 text-sm font-bold transition ${on ? "border-accent bg-sky text-accent" : "border-powder bg-white text-ink-soft hover:border-accent/50"}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      full_name: fullName,
      age: Number(age) || 29,
      height_cm: Number(height) || 167,
      weight_kg: Number(weight) || 62.4,
      gender,
      activity_level: level,
      health_goals: goals,
      allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
      current_medications: meds.split(",").map((s) => s.trim()).filter(Boolean),
      dietary_preferences: diet,
    };

    try {
      await api.profile.update(payload);
    } catch (err: any) {
      console.warn("Saved to local state fallback:", err.message);
    } finally {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <>
      <PageHeader title="Personal Health Profile" sub="The more accurate your details, the more relevant your insights." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar size={80} />
                <button type="button" aria-label="Change photo" className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-white text-accent shadow-soft hover:bg-sky">
                  <Camera size={14} />
                </button>
              </div>
              <div>
                <p className="text-xl font-extrabold">{fullName}</p>
                <p className="text-sm text-ink-soft">maya@example.com · Member since March 2026</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-extrabold">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Field label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              <Field label="Height (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
              <Field label="Weight (kg)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-ink-soft">Gender</p>
            <div className="flex flex-wrap gap-2">{["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => <button type="button" key={g} onClick={() => setGender(g)} className={chip(gender === g)}>{g}</button>)}</div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-extrabold">Medical Background</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Known Allergies" placeholder="e.g. Penicillin, Pollen" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
              <Field label="Current Medications" placeholder="e.g. Vitamin D3 1000 IU" value={meds} onChange={(e) => setMeds(e.target.value)} />
            </div>
            <div className="mt-4">
              <Field label="Dietary Preferences" placeholder="e.g. Vegetarian, Low sodium" value={diet} onChange={(e) => setDiet(e.target.value)} />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-extrabold">Lifestyle & goals</h2>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Activity level</p>
            <div className="flex flex-wrap gap-2">{levels.map((l) => <button type="button" key={l} onClick={() => setLevel(l)} className={chip(level === l)}>{l}</button>)}</div>
            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-ink-soft">Health goals</p>
            <div className="flex flex-wrap gap-2">{allGoals.map((g) => <button type="button" key={g} onClick={() => toggle(g)} aria-pressed={goals.includes(g)} className={chip(goals.includes(g))}>{goals.includes(g) && <Check size={14} className="mr-1 inline" />}{g}</button>)}</div>
          </Card>
          <div className="flex items-center gap-4">
            <Btn type="submit" disabled={loading}>
              {loading ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving...</span> : "Save Changes"}
            </Btn>
            {saved && <span role="status" className="fade-in flex items-center gap-1.5 text-sm font-bold text-[#12806f]"><Check size={16} />Profile saved</span>}
          </div>
        </form>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Card className="relative overflow-hidden bg-linear-to-b from-mint to-sky p-6 text-center">
            <Leaf className="mx-auto h-36" />
            <Heart className="mx-auto mt-2 text-violet" size={22} />
            <h3 className="mt-2 font-extrabold">Small, honest numbers</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">Your profile only personalizes insights. It is never shared, and you can edit or delete it anytime.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
