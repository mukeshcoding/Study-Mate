import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profileContext";
import { useSubjects } from "@/lib/useSubjects";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Timer, Coffee, Check } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { toast } from "@/components/ui/use-toast";

const PRESETS = {
  "25/5": { focus: 25, break: 5, label: "25 / 5" },
  "50/10": { focus: 50, break: 10, label: "50 / 10" },
  "custom": { focus: 25, break: 5, label: "Custom" },
};

export default function Focus() {
  const [params] = useSearchParams();
  const { profile, updateProfile, awardXp, addDailyStudy, recordActivity, syncAchievements } = useProfile();
  const { subjects } = useSubjects();
  const [presetKey, setPresetKey] = useState(params.get("preset") || profile?.focus_preset || "25/5");
  const [customFocus, setCustomFocus] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [subjectId, setSubjectId] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | focus | break | done
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const intervalRef = useRef(null);

  const cfg = presetKey === "custom" ? { focus: customFocus, break: customBreak } : PRESETS[presetKey];
  const totalSeconds = (phase === "break" ? cfg.break : cfg.focus) * 60;

  useEffect(() => {
    if (presetKey !== "custom") updateProfile({ focus_preset: presetKey });
  }, [presetKey]);

  const stopInterval = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  useEffect(() => () => stopInterval(), []);

  // re-create interval when running toggles
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [running]);

  // detect completion
  useEffect(() => {
    if (running && secondsLeft === 0 && phase !== "idle") {
      setRunning(false);
      handlePhaseEnd();
    }
  }, [secondsLeft, running, phase]);

  async function handlePhaseEnd() {
    if (phase === "focus") {
      // record session
      try {
        const subj = subjects.find((s) => s.id === subjectId);
        await base44.entities.StudySession.create({
          subject_id: subjectId || null,
          subject_name: subj?.name || null,
          duration_minutes: cfg.focus,
          started_at: startedAt || new Date().toISOString(),
          completed_at: new Date().toISOString(),
          preset: presetKey,
          completed: true,
        });
        await awardXp(20);
        await addDailyStudy(cfg.focus);
        await recordActivity();
        const sessions = await base44.entities.StudySession.list("-created_date", 500);
        const focusCount = (sessions || []).length;
        const habits = await base44.entities.HabitLog.filter({ date: new Date().toISOString().slice(0,10) });
        await syncAchievements({ focusSessions: focusCount, tasksCompleted: 0, habitsCompleted: (habits || []).length });
        toast({ title: "Focus complete! +20 XP", description: `Nice work. Time for a ${cfg.break} min break.` });
        setPhase("break");
        setSecondsLeft(cfg.break * 60);
        setRunning(true);
      } catch (e) {
        toast({ title: "Could not save session", description: e.message });
        setPhase("idle");
      }
    } else if (phase === "break") {
      setPhase("idle");
      setSecondsLeft(0);
      toast({ title: "Break over", description: "Ready for another focus session?" });
    }
  }

  const start = () => {
    if (phase === "idle") {
      setPhase("focus");
      setSecondsLeft(cfg.focus * 60);
      setStartedAt(new Date().toISOString());
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const reset = () => { stopInterval(); setRunning(false); setPhase("idle"); setSecondsLeft(0); };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const isFocus = phase === "focus";
  const isBreak = phase === "break";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="font-heading font-extrabold text-2xl text-foreground">Focus</h1>
        <p className="text-sm text-muted-foreground">Stay in the zone with a Pomodoro timer.</p>
      </div>

      {/* Preset selector */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {Object.entries(PRESETS).map(([k, v]) => (
          <button key={k} onClick={() => { if (phase === "idle") setPresetKey(k); }} disabled={phase !== "idle"}
            className={`rounded-2xl border p-3 text-center transition disabled:opacity-50 ${presetKey === k ? "border-indigo-500 bg-indigo-500/10" : "border-border bg-card"}`}>
            <div className="font-heading font-bold text-foreground">{k === "custom" ? "Custom" : v.label}</div>
            <div className="text-[0.65rem] text-muted-foreground">{k === "custom" ? "Set your own" : `${v.focus} min focus`}</div>
          </button>
        ))}
      </div>

      {presetKey === "custom" && phase === "idle" && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Focus (min)</Label>
            <Input type="number" min={1} max={180} value={customFocus} onChange={(e) => setCustomFocus(Math.max(1, +e.target.value || 1))} className="h-10 bg-card" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Break (min)</Label>
            <Input type="number" min={1} max={60} value={customBreak} onChange={(e) => setCustomBreak(Math.max(1, +e.target.value || 1))} className="h-10 bg-card" />
          </div>
        </div>
      )}

      {/* Subject selector */}
      <div className="mb-6">
        <Label className="text-xs mb-1.5 block">Studying</Label>
        <Select value={subjectId || "none"} onValueChange={(v) => setSubjectId(v === "none" ? "" : v)} disabled={phase !== "idle"}>
          <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="No subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Timer */}
      <div className="rounded-3xl border border-border bg-card p-8 flex flex-col items-center focus-glow">
        <div className="flex items-center gap-2 mb-6">
          {isBreak ? <Coffee className="w-4 h-4 text-emerald-400" /> : <Timer className="w-4 h-4 text-indigo-400" />}
          <span className="text-sm font-medium text-muted-foreground">
            {phase === "idle" ? "Ready to focus" : isFocus ? "Focus session" : "Break time"}
          </span>
        </div>
        <CircularProgress value={progress} size={240} stroke={10} gradId="focusRing">
          <div className="font-heading font-extrabold text-5xl text-foreground tabular-nums tracking-tight">{mm}:{ss}</div>
          <div className="text-xs text-muted-foreground mt-1">{isBreak ? "relax" : isFocus ? "stay focused" : "tap start"}</div>
        </CircularProgress>

        <div className="flex items-center gap-3 mt-8">
          {phase === "idle" && (
            <Button onClick={start} className="h-12 px-8 gradient-accent text-white"><Play className="w-4 h-4 mr-2 fill-white" /> Start</Button>
          )}
          {running && (
            <Button onClick={pause} variant="outline" className="h-12 px-8"><Pause className="w-4 h-4 mr-2" /> Pause</Button>
          )}
          {phase !== "idle" && !running && (
            <Button onClick={resume} className="h-12 px-8 gradient-accent text-white"><Play className="w-4 h-4 mr-2 fill-white" /> Resume</Button>
          )}
          {phase !== "idle" && (
            <Button onClick={reset} variant="outline" className="h-12 px-8"><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center"><Check className="w-4 h-4 text-indigo-300" /></div>
        <div className="text-sm text-muted-foreground">
          Each completed focus session earns <span className="text-foreground font-semibold">+20 XP</span> and counts toward your daily goal and streak.
        </div>
      </div>
    </div>
  );
}