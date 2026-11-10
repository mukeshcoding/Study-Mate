import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profileContext";
import { invalidateSubjects } from "@/lib/useSubjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BookOpen, ArrowRight, Check, Plus, X } from "lucide-react";
import { COLOR_OPTIONS, colorClasses } from "@/lib/colors";

const SUGGESTED = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English", "Computer Science", "Economics"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [education, setEducation] = useState("");
  const [goal, setGoal] = useState(120);
  const [subjects, setSubjects] = useState([]);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleSubject = (s) => {
    setSubjects((prev) => prev.find((x) => x.name === s) ? prev.filter((x) => x.name !== s) : [...prev, { name: s, color: COLOR_OPTIONS[prev.length % COLOR_OPTIONS.length] }]);
  };

  const addCustom = () => {
    const n = custom.trim();
    if (!n) return;
    if (subjects.find((x) => x.name.toLowerCase() === n.toLowerCase())) { setCustom(""); return; }
    setSubjects((prev) => [...prev, { name: n, color: COLOR_OPTIONS[prev.length % COLOR_OPTIONS.length] }]);
    setCustom("");
  };

  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: name.trim(),
        education_level: education,
        daily_goal_minutes: goal,
        onboarding_complete: true,
      });
      if (subjects.length) {
        await base44.entities.Subject.bulkCreate(subjects);
        invalidateSubjects();
      }
      navigate("/");
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-8 pb-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading font-extrabold text-foreground text-lg">StudyMate</span>
      </header>

      <div className="flex-1 px-5 pb-8 max-w-md mx-auto w-full">
        {/* progress dots */}
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? "gradient-accent" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-foreground">Welcome to StudyMate</h1>
              <p className="text-sm text-muted-foreground mt-1">Let's set up your space. What should we call you?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" className="h-12" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Education level</Label>
              <div className="grid grid-cols-2 gap-2">
                {["High School", "Undergraduate", "Postgraduate", "Other"].map((lvl) => (
                  <button key={lvl} onClick={() => setEducation(lvl)} className={`px-4 py-3 rounded-xl border text-sm font-medium transition ${education === lvl ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{lvl}</button>
                ))}
              </div>
            </div>
            <Button className="w-full h-12" disabled={!name.trim() || !education} onClick={() => setStep(1)}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-foreground">Daily study goal</h1>
              <p className="text-sm text-muted-foreground mt-1">How many minutes do you want to study each day?</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="font-heading font-extrabold text-4xl gradient-text">{goal}</div>
              <div className="text-sm text-muted-foreground">minutes per day</div>
              <Slider value={[goal]} onValueChange={(v) => setGoal(v[0])} min={15} max={480} step={15} className="mt-5" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>15 min</span><span>8 hrs</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[60, 120, 240].map((g) => (
                <button key={g} onClick={() => setGoal(g)} className={`py-2.5 rounded-xl border text-sm font-medium transition ${goal === g ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-border bg-card text-muted-foreground"}`}>{g < 60 ? `${g}m` : `${g/60}h`}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(0)}>Back</Button>
              <Button className="flex-1 h-12" onClick={() => setStep(2)}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-foreground">Your subjects</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick the subjects you're studying. You can change these later.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => {
                const on = !!subjects.find((x) => x.name === s);
                return (
                  <button key={s} onClick={() => toggleSubject(s)} className={`px-3.5 py-2 rounded-full border text-sm font-medium transition flex items-center gap-1.5 ${on ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-border bg-card text-muted-foreground"}`}>
                    {on && <Check className="w-3.5 h-3.5" />}{s}
                  </button>
                );
              })}
              {subjects.filter((x) => !SUGGESTED.includes(x.name)).map((s) => (
                <span key={s.name} className={`px-3.5 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 border-indigo-500 bg-indigo-500/15 text-indigo-300`}>
                  {s.name}<button onClick={() => toggleSubject(s.name)}><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} placeholder="Add your own" className="h-11" />
              <Button variant="outline" className="h-11 px-3" onClick={addCustom}><Plus className="w-4 h-4" /></Button>
            </div>
            <Button className="w-full h-12" disabled={saving} onClick={finish}>
              {saving ? "Setting up..." : <>Start studying <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
            <button onClick={() => { updateProfile({ onboarding_complete: true }); navigate("/"); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">Skip for now</button>
          </div>
        )}
      </div>
    </div>
  );
}