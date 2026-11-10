import React from "react";
import { Link } from "react-router-dom";
import { Flame, Timer, CheckCircle2, Target } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { useProfile } from "@/lib/profileContext";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function HomeHero({ studyMinutesToday, tasksDoneToday, tasksTotalToday }) {
  const { profile, levelProgress: lp } = useProfile();
  if (!profile || !lp) return null;
  const goal = profile.daily_goal_minutes || 120;
  const goalPct = Math.min(1, studyMinutesToday / goal);
  const firstName = (profile.full_name || "").split(" ")[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border p-6 sm:p-7"
      style={{ background: "radial-gradient(120% 120% at 0% 0%, hsl(258 90% 66% / 0.18), transparent 55%), radial-gradient(120% 120% at 100% 100%, hsl(239 84% 67% / 0.16), transparent 55%), hsl(var(--card))" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}{firstName ? `, ${firstName}` : ""} 👋</p>
          <h1 className="font-heading font-extrabold tracking-tight text-foreground mt-1" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>
            Ready to <span className="gradient-text">study smarter?</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">{profile.current_streak || 0}</span>
            <span className="text-[0.65rem] text-amber-300/70">day streak</span>
          </div>
        </div>
      </div>

      {/* Level + XP bar */}
      <div className="mt-5 rounded-2xl bg-background/40 border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="glass-pill rounded-full px-2.5 py-1 text-xs font-bold text-violet-200">LVL {lp.level}</span>
            <span className="text-xs text-muted-foreground">{profile.xp || 0} XP</span>
          </div>
          <span className="text-xs text-muted-foreground">{lp.toNext} XP to LVL {lp.level + 1}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-accent rounded-full transition-all duration-700" style={{ width: `${lp.progress * 100}%` }} />
        </div>
      </div>

      {/* 3-stat strip */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-background/40 border border-border p-3 flex flex-col gap-1">
          <Timer className="w-4 h-4 text-indigo-400" />
          <div className="font-heading font-extrabold text-xl text-foreground tabular-nums">{Math.floor(studyMinutesToday / 60)}h {studyMinutesToday % 60}m</div>
          <div className="text-[0.65rem] text-muted-foreground">studied today</div>
        </div>
        <div className="rounded-2xl bg-background/40 border border-border p-3 flex flex-col gap-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <div className="font-heading font-extrabold text-xl text-foreground tabular-nums">{tasksDoneToday}/{tasksTotalToday}</div>
          <div className="text-[0.65rem] text-muted-foreground">tasks done</div>
        </div>
        <div className="rounded-2xl bg-background/40 border border-border p-3 flex items-center justify-center">
          <CircularProgress value={goalPct} size={64} stroke={6} gradId="heroGoal">
            <div className="text-center">
              <div className="font-heading font-bold text-sm text-foreground leading-none">{Math.round(goalPct * 100)}%</div>
            </div>
          </CircularProgress>
        </div>
      </div>
    </div>
  );
}