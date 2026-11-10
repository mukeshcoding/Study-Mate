import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, Play } from "lucide-react";
import { useProfile } from "@/lib/profileContext";

const PRESETS = [
  { key: "25/5", label: "25 / 5", focus: 25, break: 5, desc: "Classic" },
  { key: "50/10", label: "50 / 10", focus: 50, break: 10, desc: "Deep work" },
];

export default function FocusLaunchpad() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const [preset, setPreset] = useState(profile?.focus_preset || "25/5");

  const select = (key) => {
    setPreset(key);
    updateProfile({ focus_preset: key });
  };

  const start = () => navigate(`/focus?preset=${encodeURIComponent(preset)}`);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 relative overflow-hidden focus-glow">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center">
          <Timer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-foreground leading-tight">Focus Session</h3>
          <p className="text-xs text-muted-foreground">Pomodoro timer</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PRESETS.map((p) => (
          <button key={p.key} onClick={() => select(p.key)} className={`rounded-2xl border p-3 text-left transition ${preset === p.key ? "border-indigo-500 bg-indigo-500/10" : "border-border bg-background/40 hover:bg-muted/50"}`}>
            <div className="font-heading font-bold text-foreground">{p.label}</div>
            <div className="text-[0.65rem] text-muted-foreground">{p.desc}</div>
          </button>
        ))}
      </div>
      <button onClick={start} className="w-full h-12 rounded-2xl gradient-accent flex items-center justify-center gap-2 font-semibold text-white active:scale-[0.98] transition">
        <Play className="w-4 h-4 fill-white" /> Start Focus Session
      </button>
    </div>
  );
}